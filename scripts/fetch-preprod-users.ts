/**
 * Fetch Preprod Users Script
 * 
 * Queries the Midnight Preprod indexer to fetch wallet addresses that have
 * interacted with the RevenueSplit contract.
 * 
 * Usage: npm run fetch-users
 */

const CONTRACT_ADDRESS = '02005a9c0897f1da76135dd6977be415f3cf374466986b24d77eb60cbe4eeef45a8e';
const INDEXER_URL = 'https://indexer.preprod.midnight.network/api/v4/graphql';

interface Transaction {
  hash: string;
  from?: string;
  to?: string;
  blockNumber: number;
}

interface IndexerResponse {
  data?: {
    transactions?: Transaction[];
  };
  errors?: Array<{ message: string }>;
}

/**
 * Fetch transactions involving the contract from Midnight Preprod indexer
 */
async function fetchContractTransactions(): Promise<Set<string>> {
  const query = `
    query GetContractTransactions($contractAddress: String!) {
      transactions(
        filter: {
          or: [
            { to: { eq: $contractAddress } }
            { from: { eq: $contractAddress } }
          ]
        }
        orderBy: BLOCK_NUMBER_DESC
      ) {
        nodes {
          hash
          from
          to
          blockNumber
        }
      }
    }
  `;

  try {
    const response = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          contractAddress: CONTRACT_ADDRESS,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: IndexerResponse = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('Failed to fetch transactions from indexer');
    }

    const transactions = result.data?.transactions || [];
    const walletAddresses = new Set<string>();

    // Extract unique wallet addresses from transactions
    transactions.forEach((tx: any) => {
      if (tx.from && tx.from !== CONTRACT_ADDRESS) {
        walletAddresses.add(tx.from);
      }
      if (tx.to && tx.to !== CONTRACT_ADDRESS) {
        walletAddresses.add(tx.to);
      }
    });

    return walletAddresses;
  } catch (error) {
    console.error('Error fetching contract transactions:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Fetching Preprod user wallet addresses...');
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Indexer: ${INDEXER_URL}\n`);

  try {
    const walletAddresses = await fetchContractTransactions();

    console.log(`✅ Found ${walletAddresses.size} unique wallet addresses:\n`);

    const sortedAddresses = Array.from(walletAddresses).sort();
    sortedAddresses.forEach((address, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${address}`);
    });

    console.log(`\n📊 Total: ${walletAddresses.size} Preprod users`);

    if (walletAddresses.size >= 70) {
      console.log('🎉 Requirement met: 70+ Preprod users verified!');
    } else {
      console.log(`⚠️  Need ${70 - walletAddresses.size} more users to meet Level 6 requirement`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch user addresses');
    process.exit(1);
  }
}

main();
