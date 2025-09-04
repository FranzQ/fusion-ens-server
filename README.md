# ENS Testnet API Server

A Node.js TypeScript server that provides ENS resolution for testnet networks (Sepolia and Goerli).

## Features

- ✅ ENS name resolution for testnet networks
- ✅ Reverse ENS lookup (address to name)
- ✅ Domain information retrieval
- ✅ Support for Sepolia and Goerli testnets
- ✅ RESTful API endpoints
- ✅ CORS enabled for browser extensions
- ✅ TypeScript for type safety

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
GET /resolve/:domainName?network=sepolia
```
Resolves an ENS name to an Ethereum address.

**Example:**
```bash
curl "http://localhost:3001/resolve/test.eth?network=sepolia"
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
GET /domain/:domainName?network=sepolia
```
Returns detailed information about an ENS domain.

**Example:**
```bash
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
GET /reverse/:address?network=sepolia
```
Resolves an Ethereum address to an ENS name.

**Example:**
```bash
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

- **Sepolia** (default) - Current Ethereum testnet
- **Goerli** - Legacy testnet (deprecated but still supported)

## Environment Variables

Create a `.env` file with the following variables:

```env
# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID

# Server configuration
PORT=3001
NODE_ENV=development

# ENS Registry addresses (usually the same for testnets)
SEPOLIA_ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
GOERLI_ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
```

## Integration with Browser Extension

Update your browser extension to use this local server for testnet resolution:

```javascript
// In your extension's popup.js or background.js
const testnetApiUrl = 'http://localhost:3001';

async function resolveTestnetENS(domainName) {
  try {
    const response = await fetch(`${testnetApiUrl}/resolve/${domainName}?network=sepolia`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.address;
    }
    return null;
  } catch (error) {
    console.error('Testnet resolution failed:', error);
    return null;
  }
}
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
