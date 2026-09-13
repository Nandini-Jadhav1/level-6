#!/usr/bin/env tsx
/**
 * Fetch real on-chain users from Midnight Preprod indexer for our deployed contract.
 * Queries contractAction for the Revenue Split contract and extracts unique wallet addresses
 * from unshielded transaction outputs.
 * 
 * If no transactions exist yet, reports zero users honestly — no fabrication.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const CONTRACT_ADDRESS = '02005a9c0897f1da76135dd6977be415f3cf374466986b24d77eb60cbe4eeef45a8e';
const INDEXER_URL = 'https://indexer.preprod.midnight.network/api/v4/graphql';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface UnshieldedUtxo {
  owner: string; // UnshieldedAddress is a scalar (HexEncoded or bech32 string)
  tokenType: string;
  value: string;
  createdAtTransaction: {
    hash: string;
    block: {
      height: number;
      timestamp: number;
    };
  };
}

interface Transaction {
  hash: string;
  block: {
    height: number;
    timestamp: number;
  };
  unshieldedCreatedOutputs: UnshieldedUtxo[];
}

interface ContractAction {
  address: string;
  transaction: Transaction;
}

function gql<T = any>(query: string): Promise<GraphQLResponse<T>> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const url = new URL(INDEXER_URL);
    
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

interface UserRecord {
  walletAddress: string;
  firstTxHash: string;
  timestamp: string; // ISO 8601
  blockHeight: number;
}

async function main() {
  console.log(`Querying Preprod indexer for contract: ${CONTRACT_ADDRESS}\n`);

  const response = await gql<{ contractAction: ContractAction | null }>(`{
    contractAction(address: "${CONTRACT_ADDRESS}") {
      address
      transaction {
        hash
        block {
          height
          timestamp
        }
        unshieldedCreatedOutputs {
          owner
          tokenType
          value
          createdAtTransaction {
            hash
            block {
              height
              timestamp
            }
          }
        }
      }
    }
  }`);

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    process.exit(1);
  }

  if (!response.data?.contractAction) {
    console.log('⚠️  Contract not found on Preprod, or no transactions exist yet.');
    console.log('   Outputting zero users (no fabrication).\n');
    
    const emptyOutput: UserRecord[] = [];
    
    // Write empty JSON
    fs.writeFileSync(
      path.join(process.cwd(), 'data', 'preprod-users.json'),
      JSON.stringify(emptyOutput, null, 2)
    );

    // Write empty markdown
    const md = `# Preprod Users

**Contract Address:** \`${CONTRACT_ADDRESS}\`  
**Total Unique Users:** 0

No on-chain transactions found yet. This will update as real users interact with the contract.

| Wallet Address | First Transaction | Block Height | Timestamp |
|----------------|-------------------|--------------|-----------|
| _(none)_ | - | - | - |
`;
    fs.writeFileSync(
      path.join(process.cwd(), 'docs', 'PREPROD_USERS.md'),
      md
    );

    console.log('✅ Generated:');
    console.log('   - data/preprod-users.json (0 users)');
    console.log('   - docs/PREPROD_USERS.md (0 users)');
    
    return;
  }

  // Extract unique wallet addresses from unshielded outputs
  const userMap = new Map<string, UserRecord>();
  const tx = response.data.contractAction.transaction;

  for (const output of tx.unshieldedCreatedOutputs) {
    const wallet = output.owner; // Already a string (bech32 address)
    const txInfo = output.createdAtTransaction;
    
    if (!userMap.has(wallet)) {
      userMap.set(wallet, {
        walletAddress: wallet,
        firstTxHash: txInfo.hash,
        timestamp: new Date(txInfo.block.timestamp).toISOString(),
        blockHeight: txInfo.block.height,
      });
    }
  }

  const users = Array.from(userMap.values()).sort(
    (a, b) => a.blockHeight - b.blockHeight
  );

  console.log(`✅ Found ${users.length} unique user(s)\n`);

  // Write JSON
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'preprod-users.json'),
    JSON.stringify(users, null, 2)
  );

  // Write Markdown
  const md = `# Preprod Users

**Contract Address:** \`${CONTRACT_ADDRESS}\`  
**Total Unique Users:** ${users.length}

| Wallet Address | First Transaction | Block Height | Timestamp |
|----------------|-------------------|--------------|-----------|
${users.map(u => `| \`${u.walletAddress}\` | \`${u.firstTxHash}\` | ${u.blockHeight} | ${u.timestamp} |`).join('\n')}
`;
  fs.writeFileSync(
    path.join(process.cwd(), 'docs', 'PREPROD_USERS.md'),
    md
  );

  console.log('📄 Generated:');
  console.log('   - data/preprod-users.json');
  console.log('   - docs/PREPROD_USERS.md');
  console.log(`\n🎉 ${users.length} real on-chain user(s) tracked.`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
