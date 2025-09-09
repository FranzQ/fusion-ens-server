# Fusion ENS Server

## 🎯 **What We Built**

A Node.js TypeScript server that provides ENS (Ethereum Name Service) resolution API endpoints with **multi-chain address decoding**. The server can resolve ENS names to addresses across multiple blockchains using the new `name.eth:chain` format and perform reverse lookups on both mainnet and Sepolia testnet.

## ✨ **Key Features**

- **Multi-Chain ENS Resolution**: Resolves ENS names to addresses across 20+ blockchains
- **Format Support**: `name.eth:chain` format (e.g., `onshow.eth:btc`, `ses.eth:sol`)
- **Proper Address Decoding**: Human-readable addresses for Bitcoin, Solana, Dogecoin, and Ethereum-compatible chains
- **Reverse Lookup**: Resolves Ethereum addresses back to ENS names
- **Multi-Network Support**: Works with Ethereum mainnet and Sepolia testnet
- **RESTful API**: Simple HTTP endpoints for ENS operations
- **TypeScript**: Full type safety and modern JavaScript features

## 🛠️ **Technical Implementation**

### **Architecture**
- **Express.js**: Web server framework
- **Ethers.js**: Ethereum blockchain interaction
- **TypeScript**: Type-safe development
- **CORS**: Cross-origin resource sharing enabled

### **Core Components**
- `index.ts` - Main server file with Express routes
- `ensResolver.ts` - ENS resolution logic and blockchain interaction
- `package.json` - Dependencies and build scripts

### **Dependencies**
- **express**: Web server framework
- **ethers**: Ethereum library for blockchain interaction
- **bitcoinjs-lib**: Bitcoin address decoding and validation
- **@solana/web3.js**: Solana address decoding
- **bs58**: Base58 encoding for Bitcoin-like addresses
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## 📡 **API Endpoints**

### **Health Check**
```
GET /health
```
Returns server status and timestamp.

### **Resolve ENS Name**
```
GET /resolve/:domainName?network=mainnet
```
Resolves an ENS name to an address. Supports both traditional ENS names and the new multi-chain format.

**Examples:**

**Traditional ENS (Ethereum):**
```bash
curl "http://localhost:3001/resolve/vitalik.eth?network=mainnet"
```

**Multi-Chain Format:**
```bash
curl "http://localhost:3001/resolve/onshow.eth:btc?network=mainnet"
curl "http://localhost:3001/resolve/onshow.eth:sol?network=mainnet"
curl "http://localhost:3001/resolve/onshow.eth:doge?network=mainnet"
```

**Responses:**
```json
{
  "success": true,
  "data": {
    "name": "vitalik.eth",
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "network": "mainnet"
  }
}
```

```json
{
  "success": true,
  "data": {
    "name": "onshow.eth:btc",
    "address": "bc1q9qg9exzzgcsv2x3ew34wxaszsqlsuyxcdxxuxc",
    "network": "mainnet"
  }
}
```

### **Get Domain Information**
```
GET /domain/:domainName?network=mainnet
```
Returns detailed information about an ENS domain.

**Example:**
```bash
curl "http://localhost:3001/domain/vitalik.eth?network=mainnet"
```

### **Reverse Lookup**
```
GET /reverse/:address?network=mainnet
```
Resolves an Ethereum address to an ENS name.

**Example:**
```bash
curl "http://localhost:3001/reverse/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?network=mainnet"
```

## 🔗 **Supported Blockchains**

### **Fully Decoded (Human-Readable Addresses)**
- **Bitcoin (btc)** - P2PKH, P2WPKH, P2TR formats
- **Solana (sol)** - 32-byte public key to Base58
- **Dogecoin (doge)** - P2PKH with Dogecoin network parameters

### **Ethereum-Compatible (20-byte addresses)**
- **Ethereum (eth)** - Standard Ethereum addresses
- **Base (base)** - Base network addresses
- **Arbitrum (arbi)** - Arbitrum network addresses
- **Polygon (polygon)** - Polygon network addresses
- **Avalanche (avax)** - Avalanche network addresses
- **BSC (bsc)** - Binance Smart Chain addresses
- **Optimism (op)** - Optimism network addresses

### **Supported but Raw Hex Output**
- **XRP (xrp)** - Coin type 144
- **Litecoin (ltc)** - Coin type 2
- **Cardano (ada)** - Coin type 1815
- **Zora (zora)** - Coin type 7777777
- **Linea (linea)** - Coin type 59144
- **Scroll (scroll)** - Coin type 534352
- **Mantle (mantle)** - Coin type 5000
- **Celo (celo)** - Coin type 42220
- **Gnosis (gnosis)** - Coin type 100
- **Fantom (fantom)** - Coin type 250

## 🚀 **How to Run**

### **Prerequisites**
- Node.js 18+ installed
- RPC endpoint for Ethereum networks (Infura, Alchemy, etc.)

### **Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your RPC URLs

# Run in development
npm run dev

# Build and run in production
npm run build
npm start
```

### **Environment Variables**
```env
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PORT=3001
```

## 🎯 **Problem Solved**

- **Multi-Chain ENS Resolution**: Resolves ENS names to addresses across 20+ blockchains
- **New Format Support**: Implements the `name.eth:chain` format for multi-chain resolution
- **Proper Address Decoding**: Converts raw ENS bytes to human-readable addresses
- **Centralized ENS Resolution**: Provides a single API endpoint for ENS operations
- **Multi-Network Support**: Handles both mainnet and testnet resolution
- **Simple Integration**: Easy-to-use REST API for applications
- **Type Safety**: TypeScript ensures reliable code and better development experience

## 📊 **Current Status**

- ✅ **Working Server**: Fully functional ENS resolution API
- ✅ **Multi-Chain Support**: Resolves addresses across 20+ blockchains
- ✅ **New Format**: `name.eth:chain` format fully implemented
- ✅ **Address Decoding**: Proper decoding for Bitcoin, Solana, Dogecoin, and Ethereum-compatible chains
- ✅ **Mainnet Support**: Resolves ENS names on Ethereum mainnet
- ✅ **Testnet Support**: Works with Sepolia testnet
- ✅ **Reverse Lookup**: Address to name resolution
- ✅ **Error Handling**: Proper error responses and validation

## 🔧 **Technical Details**

- **Platform**: Node.js with TypeScript
- **Framework**: Express.js
- **Blockchain**: Ethereum (mainnet + Sepolia) with multi-chain address decoding
- **Address Decoding**: Bitcoin (bitcoinjs-lib), Solana (@solana/web3.js), Base58 (bs58)
- **Port**: 3001 (configurable)
- **CORS**: Enabled for browser extension integration

## 🎯 **Integration Example**

```javascript
// Simple integration with the iOS keyboard
const apiUrl = 'http://localhost:3001';

async function resolveENS(domainName, network = 'mainnet') {
  try {
    const response = await fetch(`${apiUrl}/resolve/${domainName}?network=${network}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.address;
    }
    return null;
  } catch (error) {
    console.error('ENS resolution failed:', error);
    return null;
  }
}

// Usage
resolveENS('vitalik.eth', 'mainnet');
```

## 🏆 **Innovation**

- **Simple API**: Clean REST endpoints for ENS operations
- **Multi-Network**: Single server handles multiple Ethereum networks
- **TypeScript**: Modern development with type safety
- **Integration Ready**: Designed to work with browser extensions and mobile apps

---

**Fusion ENS Server: Simple, reliable ENS resolution for Web3 applications.**