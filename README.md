# Fusion ENS Server

## 🎯 **What We Built**

A Node.js TypeScript server that provides ENS (Ethereum Name Service) resolution API endpoints. The server can resolve ENS names to Ethereum addresses and perform reverse lookups on both mainnet and Sepolia testnet.

## ✨ **Key Features**

- **ENS Resolution**: Resolves ENS names (like `vitalik.eth`) to Ethereum addresses
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
Resolves an ENS name to an Ethereum address.

**Example:**
```bash
curl "http://localhost:3001/resolve/vitalik.eth?network=mainnet"
```

**Response:**
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

- **Centralized ENS Resolution**: Provides a single API endpoint for ENS operations
- **Multi-Network Support**: Handles both mainnet and testnet resolution
- **Simple Integration**: Easy-to-use REST API for applications
- **Type Safety**: TypeScript ensures reliable code and better development experience

## 📊 **Current Status**

- ✅ **Working Server**: Fully functional ENS resolution API
- ✅ **Mainnet Support**: Resolves ENS names on Ethereum mainnet
- ✅ **Testnet Support**: Works with Sepolia testnet
- ✅ **Reverse Lookup**: Address to name resolution
- ✅ **Error Handling**: Proper error responses and validation

## 🔧 **Technical Details**

- **Platform**: Node.js with TypeScript
- **Framework**: Express.js
- **Blockchain**: Ethereum (mainnet + Sepolia)
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