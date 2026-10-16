'use client'

/**
 * Sepolia Network Configuration
 * Optimized settings for Sepolia testnet
 */

export const SEPOLIA_CHAIN_ID = 11155111

export const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  name: 'Sepolia',
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
        'https://rpc.sepolia.org',
        'https://sepolia.gateway.tenderly.co'
      ]
    },
    public: {
      http: [
        'https://rpc.sepolia.org',
        'https://sepolia.gateway.tenderly.co'
      ]
    }
  },
  blockExplorers: {
    default: {
      name: 'Sepolia Etherscan',
      url: 'https://sepolia.etherscan.io'
    }
  },
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: true
}

// Sepolia-specific contract addresses (update these with your deployed contracts)
export const SEPOLIA_CONTRACTS = {
  MEMORY_STORAGE: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x1A68e87eaFbD252c9622D2De93Ec231a5D7AD7D6',
  // Add other contract addresses as needed
}

// Sepolia faucet URLs for getting test ETH
export const SEPOLIA_FAUCETS = [
  'https://sepoliafaucet.com/',
  'https://faucet.sepolia.dev/',
  'https://sepolia-faucet.pk910.de/',
  'https://sepoliafaucet.net/'
]

// Gas settings optimized for Sepolia
export const SEPOLIA_GAS_SETTINGS = {
  // Standard gas limit for memory storage
  STORE_MEMORY_GAS_LIMIT: '200000',
  // Gas limit for memory deletion
  DELETE_MEMORY_GAS_LIMIT: '100000',
  // Gas price multiplier (1.1 = 10% higher than estimated)
  GAS_PRICE_MULTIPLIER: 1.1,
  // Max fee per gas (in gwei)
  MAX_FEE_PER_GAS: '20',
  // Max priority fee per gas (in gwei)
  MAX_PRIORITY_FEE_PER_GAS: '2'
}

// Helper function to check if we're on Sepolia
export function isSepoliaNetwork(chainId) {
  return chainId === SEPOLIA_CHAIN_ID
}

// Helper function to get Sepolia block explorer URL
export function getSepoliaExplorerUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`
}

// Helper function to get Sepolia address URL
export function getSepoliaAddressUrl(address) {
  return `https://sepolia.etherscan.io/address/${address}`
}

// Helper function to format Sepolia ETH balance
export function formatSepoliaETH(balance) {
  return `${parseFloat(balance).toFixed(4)} Sepolia ETH`
}

// Sepolia network validation
export function validateSepoliaNetwork(chainId) {
  if (!isSepoliaNetwork(chainId)) {
    throw new Error(`Invalid network. Expected Sepolia (${SEPOLIA_CHAIN_ID}), got ${chainId}`)
  }
}

// Get Sepolia RPC URL with fallbacks
export function getSepoliaRpcUrl() {
  const customRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  if (customRpc) {
    return customRpc
  }
  
  // Fallback to public RPCs
  const publicRpcs = [
    'https://rpc.sepolia.org',
    'https://sepolia.gateway.tenderly.co'
  ]
  
  return publicRpcs[0] // Return first available
}

// Sepolia network info for display
export const SEPOLIA_INFO = {
  name: 'Sepolia Testnet',
  chainId: SEPOLIA_CHAIN_ID,
  currency: 'Sepolia ETH',
  blockTime: '12 seconds',
  description: 'Ethereum Sepolia testnet for development and testing',
  faucets: SEPOLIA_FAUCETS,
  explorer: 'https://sepolia.etherscan.io'
}
