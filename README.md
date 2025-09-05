# 🔗 Fusion ENS Server

A powerful Node.js TypeScript server that provides ENS resolution for both mainnet and testnet networks with multi-chain support.

## ✨ Features

- ✅ **Multi-Network Support**: Mainnet and Sepolia testnet
- ✅ **Multi-Chain Resolution**: 15+ supported blockchain networks
- ✅ **ENS Name Resolution**: Standard .eth domain resolution
- ✅ **Reverse ENS Lookup**: Address to name resolution
- ✅ **Domain Information**: Detailed domain metadata
- ✅ **RESTful API**: Clean, consistent endpoints
- ✅ **CORS Enabled**: Browser extension integration
- ✅ **TypeScript**: Full type safety and IntelliSense
- ✅ **DNSSEC Ready**: Infrastructure for security validation

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your RPC URLs (Infura, Alchemy, etc.)
   
   **Required Environment Variables:**
   ```env
   MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build and run in production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Resolve ENS Name
```
GET /resolve/:domainName?network=mainnet
```
Resolves an ENS name to an Ethereum address or multi-chain address.

**Examples:**
```bash
# Mainnet resolution
curl "http://localhost:3001/resolve/vitalik.eth?network=mainnet"

# Testnet resolution  
curl "http://localhost:3001/resolve/test.eth?network=sepolia"

# Multi-chain resolution
curl "http://localhost:3001/resolve/vitalik.btc?network=mainnet"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "test.eth",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "network": "sepolia"
  }
}
```

### Get Domain Information
```
GET /domain/:domainName?network=mainnet
```
Returns detailed information about an ENS domain.

**Examples:**
```bash
# Mainnet domain info
curl "http://localhost:3001/domain/vitalik.eth?network=mainnet"

# Testnet domain info
curl "http://localhost:3001/domain/test.eth?network=sepolia"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "test.eth",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "resolver": "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41",
    "network": "Sepolia",
    "owner": "0x1234567890123456789012345678901234567890"
  }
}
```

### Reverse Lookup
```
GET /reverse/:address?network=mainnet
```
Resolves an Ethereum address to an ENS name.

**Examples:**
```bash
# Mainnet reverse lookup
curl "http://localhost:3001/reverse/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?network=mainnet"

# Testnet reverse lookup
curl "http://localhost:3001/reverse/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6?network=sepolia"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "name": "test.eth",
    "network": "sepolia"
  }
}
```

## Supported Networks

- **Mainnet** (default) - Ethereum mainnet with full ENS support
- **Sepolia** - Current Ethereum testnet

## Multi-Chain Support

The server supports resolution for multiple blockchain networks:

- **Ethereum**: `.eth` domains
- **Bitcoin**: `.btc` domains
- **Solana**: `.sol` domains
- **Base**: `.base` domains
- **Arbitrum**: `.arbi` domains
- **Polygon**: `.polygon` domains
- **Avalanche**: `.avax` domains
- **BSC**: `.bsc` domains
- **Optimism**: `.op` domains
- **Zora**: `.zora` domains
- **Linea**: `.linea` domains
- **Scroll**: `.scroll` domains
- **Mantle**: `.mantle` domains
- **Celo**: `.celo` domains
- **Gnosis**: `.gnosis` domains
- **Fantom**: `.fantom` domains

## Environment Variables

Create a `.env` file with the following variables:

```env
# RPC URLs (Required)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Server configuration
PORT=3001
NODE_ENV=development

# ENS Registry addresses (optional - defaults provided)
MAINNET_ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
SEPOLIA_ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
```

**RPC Provider Options:**
- **Alchemy**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Infura**: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
- **Public RPC**: `https://ethereum.publicnode.com`

## Integration with Browser Extension

The server is designed to work seamlessly with the Fusion ENS browser extension:

```javascript
// In your extension's popup.js or background.js
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

// Usage examples
resolveENS('vitalik.eth', 'mainnet');     // Mainnet resolution
resolveENS('test.eth', 'sepolia');        // Testnet resolution
resolveENS('vitalik.btc', 'mainnet');     // Multi-chain resolution
```

## Development

- **TypeScript compilation:** `npm run build`
- **Watch mode:** `npm run watch`
- **Development server:** `npm run dev`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error scenarios:
- Invalid domain name format
- Network not supported
- Domain not found
- RPC connection issues

## License

MIT
