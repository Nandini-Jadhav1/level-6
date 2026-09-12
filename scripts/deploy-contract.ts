/**
 * Deploy RevenueSplit Contract to Midnight Preprod
 * 
 * Based on official example-bboard deployment pattern
 * - midnight-js-contracts 4.1.1
 * - wallet-sdk 1.2.0
 * - FluentWalletBuilder/testkit-js pattern
 * 
 * SECURITY: Wallet seed must be provided via WALLET_SEED environment variable
 * Never commit or log the seed value
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import pino from 'pino';
import type { Logger } from 'pino';
import WebSocket from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { 
  FluentWalletBuilder, 
  RemoteTestEnvironment,
  type EnvironmentConfiguration 
} from '@midnight-ntwrk/testkit-js';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk/facade';
import { 
  DustSecretKey, 
  LedgerParameters, 
  ZswapSecretKeys,
  unshieldedToken
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { ttlOneHour, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import * as rx from 'rxjs';

// Enable WebSocket for Apollo
(globalThis as any).WebSocket = WebSocket;

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
const projectRoot = path.resolve(currentDir, '..');

// Preprod environment configuration
class PreprodEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  private getProofServerUrl(): string {
    const container = this.proofServerContainer as { getUrl(): string } | undefined;
    if (!container) {
      throw new Error('Proof server container is not available.');
    }
    return container.getUrl();
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: 'preprod',
      networkId: 'preprod',
      indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preprod.midnight.network',
      nodeWS: 'wss://rpc.preprod.midnight.network',
      faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
      proofServer: this.getProofServerUrl(),
    };
  }
}

// Wallet provider implementation (simplified from example-bboard)
class MidnightWalletProvider implements MidnightProvider, WalletProvider {
  constructor(
    private logger: pino.Logger,
    private env: EnvironmentConfiguration,
    public readonly wallet: WalletFacade,
    private zswapSecretKeys: ZswapSecretKeys,
    private dustSecretKey: DustSecretKey,
    private unshieldedKeystore: any
  ) {}

  getCoinPublicKey() {
    return this.zswapSecretKeys.coinPublicKey;
  }

  getEncryptionPublicKey() {
    return this.zswapSecretKeys.encryptionPublicKey;
  }

  async balanceTx(tx: any, ttl: Date = ttlOneHour()): Promise<any> {
    const recipe = await this.wallet.balanceUnboundTransaction(
      tx,
      { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey },
      { ttl }
    );
    const signedRecipe = await this.wallet.signRecipe(recipe, (payload) => 
      this.unshieldedKeystore.signData(payload)
    );
    return this.wallet.finalizeRecipe(signedRecipe);
  }

  submitTx(tx: any): Promise<string> {
    return this.wallet.submitTransaction(tx);
  }

  async start(): Promise<void> {
    this.logger.info('Starting wallet...');
    await this.wallet.start(this.zswapSecretKeys, this.dustSecretKey);
  }

  async stop(): Promise<void> {
    return this.wallet.stop();
  }

  static async build(
    logger: pino.Logger, 
    env: EnvironmentConfiguration, 
    seed: string
  ): Promise<MidnightWalletProvider> {
    const dustOptions = {
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead: env.walletNetworkId === 'undeployed' ? 500_000_000_000_000_000n : 1_000n,
      feeBlocksMargin: 5,
    };

    const builder = FluentWalletBuilder.forEnvironment(env).withDustOptions(dustOptions);
    const buildResult = await builder.withSeed(seed).buildWithoutStarting();
    
    const { wallet, seeds, keystore } = buildResult as any;

    const shieldedAddress = wallet.shielded.address();
    logger.info(`Wallet address: ${shieldedAddress.coinPublicKeyString()}`);

    return new MidnightWalletProvider(
      logger,
      env,
      wallet,
      ZswapSecretKeys.fromSeed(seeds.shielded),
      DustSecretKey.fromSeed(seeds.dust),
      keystore
    );
  }
}

// Wait for unshielded funds
async function waitForUnshieldedFunds(
  logger: pino.Logger,
  wallet: WalletFacade,
  env: EnvironmentConfiguration
): Promise<any> {
  const unshieldedAddress = wallet.unshielded.getAddress();
  logger.info(`Unshielded address: ${unshieldedAddress}`);
  logger.info(`Fund your wallet with tNIGHT from: ${env.faucet}`);
  logger.info('Waiting for funds...');

  const unshieldedState = await rx.firstValueFrom(
    wallet.state().pipe(
      rx.filter((s) => {
        const balance = s.unshielded.balances[unshieldedToken().raw];
        return balance !== undefined && balance > 0n;
      }),
      rx.map((s) => s.unshielded)
    )
  );

  const balance = unshieldedState.balances[unshieldedToken().raw];
  logger.info(`Received tNIGHT balance: ${balance}`);
  return unshieldedState;
}

// Generate DUST
async function generateDust(
  logger: pino.Logger,
  seed: string,
  unshieldedState: any,
  wallet: WalletFacade
): Promise<string | null> {
  const dustState = await wallet.dust.waitForSyncedState();
  const utxos = unshieldedState.availableCoins.filter(
    (coin: any) => !coin.meta.registeredForDustGeneration
  );

  if (utxos.length === 0) {
    logger.info('No unregistered UTXOs found for DUST generation.');
    return null;
  }

  logger.info(`Generating DUST with ${utxos.length} UTXOs...`);

  // Get unshielded keystore (simplified)
  const { HDWallet, Roles } = await import('@midnight-ntwrk/wallet-sdk');
  const { createKeystore } = await import('@midnight-ntwrk/wallet-sdk');
  const { getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  
  const seedBuffer = Buffer.from(seed, 'hex');
  const hdWalletResult = HDWallet.fromSeed(seedBuffer) as any;
  const hdWallet = hdWalletResult.hdWallet;
  const derivationResult = hdWallet.selectAccount(0).selectRole(Roles.NightExternal).deriveKeyAt(0);
  
  if (derivationResult.type === 'keyOutOfBounds') {
    throw new Error('Key derivation out of bounds');
  }

  const unshieldedSeed = derivationResult.key;
  const networkId = getNetworkId();
  const unshieldedKeystore = createKeystore(unshieldedSeed, networkId);

  const recipe = await wallet.registerNightUtxosForDustGeneration(
    utxos,
    unshieldedKeystore.getPublicKey(),
    (payload) => unshieldedKeystore.signData(payload),
    dustState.address
  );

  const transaction = await wallet.finalizeRecipe(recipe);
  const txId = await wallet.submitTransaction(transaction);

  logger.info(`DUST generation transaction submitted: ${txId}`);

  // Wait for DUST balance
  logger.info('Waiting for DUST balance...');
  const dustBalance = await rx.firstValueFrom(
    wallet.state().pipe(
      rx.filter((s) => s.dust.balance(new Date()) > 0n),
      rx.map((s) => s.dust.balance(new Date()))
    )
  );

  logger.info(`DUST balance: ${dustBalance}`);
  return txId;
}

// Main deployment function
async function deployRevenueSplitContract() {
  const logger = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  });

  const rli = createInterface({ input, output, terminal: true });

  try {
    logger.info('=== Midnight Preprod Contract Deployment ===');
    logger.info('Network: Preprod');
    logger.info('Proof Server: http://localhost:6300 (must be running)');

    // Get wallet seed from environment variable
    let seed = process.env.WALLET_SEED;

    if (!seed) {
      logger.warn('WALLET_SEED environment variable not set');
      const choice = await rli.question(
        '\nWallet options:\n  1. Generate new wallet\n  2. Enter existing seed\n  3. Exit\nChoice: '
      );

      if (choice === '1') {
        const crypto = await import('crypto');
        seed = crypto.randomBytes(32).toString('hex');
        logger.info('Generated new wallet seed (SAVE THIS SECURELY):');
        logger.info(`WALLET_SEED=${seed}`);
      } else if (choice === '2') {
        seed = await rli.question('Enter your 64-character hex seed: ');
      } else {
        logger.info('Exiting...');
        return;
      }
    }

    if (!seed || seed.length !== 64) {
      throw new Error('Invalid wallet seed (must be 64-character hex string)');
    }

    // Initialize network
    setNetworkId('preprod');
    const testEnv = new PreprodEnvironment(logger);
    const envConfig = await testEnv.start();

    logger.info('Environment started successfully');

    // Build wallet
    logger.info('Building wallet...');
    const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
    await walletProvider.start();

    // Wait for funds
    const unshieldedState = await waitForUnshieldedFunds(
      logger,
      walletProvider.wallet,
      envConfig
    );

    // Generate DUST
    const dustTxId = await generateDust(logger, seed, unshieldedState, walletProvider.wallet);
    if (dustTxId) {
      logger.info('DUST generation complete');
    }

    // Deploy contract
    logger.info('Deploying RevenueSplit contract...');

    const zkConfigPath = path.resolve(projectRoot, 'contracts', 'managed', 'RevenueSplit');
    const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

    const providers = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: 'revenue-split-private-state',
        signingKeyStoreName: 'revenue-split-signing-keys',
        privateStoragePasswordProvider: () => 'RevenueSplit-Preprod-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfig.indexer, envConfig.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfig.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };

    // Load compiled contract
    // @ts-ignore - Contract module generated by Compact compiler
    const CompiledContractModule = await import(
      '../contracts/managed/RevenueSplit/contract/index.js'
    );

    const deployedContract = await deployContract(providers, {
      compiledContract: CompiledContractModule,
      args: [], // No initialization args needed - initialize circuit will be called separately
    });

    const contractAddress = deployedContract.deployTxData.public.contractAddress;

    logger.info('=== DEPLOYMENT SUCCESSFUL ===');
    logger.info(`Contract Address: ${contractAddress}`);
    logger.info(`Transaction Hash: ${deployedContract.deployTxData.public.txHash}`);
    logger.info(`Block Height: ${deployedContract.deployTxData.public.blockHeight}`);

    // Save contract address to file
    const fs = await import('fs/promises');
    await fs.writeFile(
      path.resolve(projectRoot, '.contract-address'),
      contractAddress,
      'utf-8'
    );
    logger.info('Contract address saved to .contract-address');

    // Stop wallet
    await walletProvider.stop();
    await testEnv.shutdown();

    logger.info('Deployment complete!');
  } catch (error) {
    logger.error('Deployment failed:');
    if (error instanceof Error) {
      logger.error(error.message);
      logger.debug(error.stack);
    } else {
      logger.error(String(error));
    }
    process.exit(1);
  } finally {
    rli.close();
  }
}

// Run deployment
deployRevenueSplitContract();
