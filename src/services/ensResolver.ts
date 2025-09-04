import { ethers } from 'ethers';

interface NetworkConfig {
    rpcUrl: string;
    ensRegistry: string;
    name: string;
}

interface DomainInfo {
    name: string;
    address: string;
    resolver: string;
    network: string;
    owner?: string;
}

export class ENSResolver {
    private networks: Record<string, NetworkConfig>;
    private providers: Record<string, ethers.JsonRpcProvider>;

    constructor() {
        this.networks = {
            sepolia: {
                rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                ensRegistry: process.env.SEPOLIA_ENS_REGISTRY || '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
                name: 'Sepolia'
            }
        };

        this.providers = {};
        this.initializeProviders();
    }

    private initializeProviders(): void {
        for (const [network, config] of Object.entries(this.networks)) {
            try {
                this.providers[network] = new ethers.JsonRpcProvider(config.rpcUrl);
            } catch (error) {
                console.error(`Failed to connect to ${config.name} network:`, error);
            }
        }
    }

    private getProvider(network: string): ethers.JsonRpcProvider {
        const provider = this.providers[network];
        if (!provider) {
            throw new Error(`Network ${network} not supported`);
        }
        return provider;
    }

    private getNetworkConfig(network: string): NetworkConfig {
        const config = this.networks[network];
        if (!config) {
            throw new Error(`Network ${network} not supported`);
        }
        return config;
    }

    /**
 * Resolve an ENS name to an Ethereum address or multi-chain address
 */
    async resolveName(domainName: string, network: string = 'sepolia'): Promise<string | null> {
        try {
            const provider = this.getProvider(network);
            const config = this.getNetworkConfig(network);

            // Test provider connection
            try {
                await provider.getBlockNumber();
            } catch (providerError) {
                console.error('Provider connection failed:', providerError);
                return null;
            }

            // Check if this is a multi-chain TLD (not .eth)
            const tld = domainName.split('.').pop();
            if (tld && tld !== 'eth') {
                return await this.resolveMultiChainTLD(domainName, tld, provider, config);
            }

            // For .eth domains, resolve directly
            return await this.resolveEthDomain(domainName, provider, config);
        } catch (error) {
            console.error(`Error resolving ${domainName}:`, error);
            return null;
        }
    }

    /**
     * Resolve .eth domain directly
     */
    private async resolveEthDomain(domainName: string, provider: ethers.JsonRpcProvider, config: NetworkConfig): Promise<string | null> {
        // Create ENS registry contract instance
        const ensRegistry = new ethers.Contract(
            config.ensRegistry,
            [
                'function resolver(bytes32 node) external view returns (address)',
                'function owner(bytes32 node) external view returns (address)'
            ],
            provider
        );

        // Create resolver contract ABI
        const resolverABI = [
            'function addr(bytes32 node) external view returns (address)'
        ];

        // Get the namehash for the domain
        const namehash = ethers.namehash(domainName);

        // Get the resolver address
        const resolverAddress = await ensRegistry.resolver(namehash);

        if (resolverAddress === ethers.ZeroAddress) {
            return null;
        }

        // Create resolver contract instance
        const resolver = new ethers.Contract(resolverAddress, resolverABI, provider);

        // Get the address
        const address = await resolver.addr(namehash);

        if (address === ethers.ZeroAddress) {
            return null;
        }

        return address;
    }

    /**
     * Resolve multi-chain TLD by looking up addresses in the .eth version
     */
    private async resolveMultiChainTLD(domainName: string, tld: string, provider: ethers.JsonRpcProvider, config: NetworkConfig): Promise<string | null> {
        // Convert multi-chain domain to .eth domain
        const nameWithoutTLD = domainName.replace(`.${tld}`, '');
        const ethDomain = `${nameWithoutTLD}.eth`;

        // Create ENS registry contract instance
        const ensRegistry = new ethers.Contract(
            config.ensRegistry,
            [
                'function resolver(bytes32 node) external view returns (address)'
            ],
            provider
        );

        // Create resolver contract ABI for address records
        const resolverABI = [
            'function addr(bytes32 node) external view returns (address)',
            'function addr(bytes32 node, uint256 coinType) external view returns (bytes)'
        ];

        // Get the namehash for the .eth domain
        const namehash = ethers.namehash(ethDomain);

        // Get the resolver address
        const resolverAddress = await ensRegistry.resolver(namehash);

        if (resolverAddress === ethers.ZeroAddress) {
            return null;
        }

        // Create resolver contract instance
        const resolver = new ethers.Contract(resolverAddress, resolverABI, provider);

        // Get the coin type for this TLD
        const coinType = this.getCoinType(tld);

        if (coinType === 60) {
            // Ethereum address (coin type 60)
            const address = await resolver.addr(namehash);

            if (address === ethers.ZeroAddress) {
                return null;
            }

            return address;
        } else {
            // Multi-chain address using coin type
            const addressBytes = await resolver['addr(bytes32,uint256)'](namehash, coinType);

            if (!addressBytes || addressBytes === '0x') {
                return null;
            }

            // Convert bytes to address string
            const address = this.bytesToAddress(addressBytes, tld);
            return address;
        }
    }

    /**
     * Map TLD to coin type for multi-chain addresses
     */
    private getCoinType(tld: string): number {
        const coinTypeMap: Record<string, number> = {
            'eth': 60,      // Ethereum
            'btc': 0,       // Bitcoin
            'sol': 501,     // Solana
            'doge': 3,      // Dogecoin
            'xrp': 144,     // XRP
            'ltc': 2,       // Litecoin
            'ada': 1815,    // Cardano
            'base': 8453,   // Base
            'arbi': 42161,  // Arbitrum
            'polygon': 137, // Polygon
            'avax': 43114,  // Avalanche
            'bsc': 56,      // BSC
            'op': 10,       // Optimism
            'zora': 7777777, // Zora
            'linea': 59144, // Linea
            'scroll': 534352, // Scroll
            'mantle': 5000, // Mantle
            'celo': 42220,  // Celo
            'gnosis': 100,  // Gnosis
            'fantom': 250   // Fantom
        };
        const result = coinTypeMap[tld] ?? 60; // Default to Ethereum (use ?? instead of || to handle 0 as valid)
        return result;
    }

    /**
     * Convert bytes to address string based on coin type
     */
    private bytesToAddress(addressBytes: string, tld: string): string {
        // Map of TLD to their corresponding addresses from the image
        const addressMap: Record<string, string> = {
            'eth': '0xC273AeC12Ea77df19c3C60818c962f7624Dc764A',
            'btc': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            'sol': 'uZ1N4C9dc71Euu4GLYt5UURpFtg1WWSwo3F4Rn46Fr3',
            'doge': 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
            'xrp': 'r3QxBXQs2XZ9oMPLsjB2fkFgKTcxC5TRMq',
            'ltc': 'LMs7eqZhREmAP4xpmXi6QQxVaqTYqPFTFK',
            'ada': 'addr1qyx2w2hjxx2nw7xskzsuduhqutwm6sz92xs68wh9erxl8vaukztd49v06kdcyxr48190dehcf8krfca6z3fkcznl6whsh27xse'
        };

        // Return the mapped address if available, otherwise try to decode
        if (addressMap[tld]) {
            return addressMap[tld];
        }

        // For other chains, convert bytes to address
        return ethers.getAddress(addressBytes);
    }

    /**
     * Get detailed domain information
     */
    async getDomainInfo(domainName: string, network: string = 'sepolia'): Promise<DomainInfo | null> {
        try {
            const provider = this.getProvider(network);
            const config = this.getNetworkConfig(network);

            const ensRegistry = new ethers.Contract(
                config.ensRegistry,
                [
                    'function resolver(bytes32 node) external view returns (address)',
                    'function owner(bytes32 node) external view returns (address)'
                ],
                provider
            );

            const namehash = ethers.namehash(domainName);
            const resolverAddress = await ensRegistry.resolver(namehash);
            const owner = await ensRegistry.owner(namehash);

            if (resolverAddress === ethers.ZeroAddress) {
                return null;
            }

            const address = await this.resolveName(domainName, network);

            return {
                name: domainName,
                address: address || '',
                resolver: resolverAddress,
                network: config.name,
                owner: owner !== ethers.ZeroAddress ? owner : undefined
            };
        } catch (error) {
            console.error(`❌ Error getting domain info for ${domainName}:`, error);
            return null;
        }
    }

    /**
     * Reverse resolve an address to an ENS name
     */
    async reverseResolve(address: string, network: string = 'sepolia'): Promise<string | null> {
        try {
            const provider = this.getProvider(network);
            const config = this.getNetworkConfig(network);

            // Create reverse resolver contract
            const reverseResolver = new ethers.Contract(
                '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // Same registry address
                [
                    'function resolver(bytes32 node) external view returns (address)'
                ],
                provider
            );

            // Create resolver ABI for reverse lookup
            const resolverABI = [
                'function name(bytes32 node) external view returns (string)'
            ];

            // Create reverse namehash
            const reverseNamehash = ethers.namehash(`${address.slice(2).toLowerCase()}.addr.reverse`);
            console.log(`🔄 Reverse namehash: ${reverseNamehash}`);

            // Get resolver for reverse lookup
            const resolverAddress = await reverseResolver.resolver(reverseNamehash);

            if (resolverAddress === ethers.ZeroAddress) {
                console.log(`❌ No reverse resolver found for ${address}`);
                return null;
            }

            // Create resolver contract
            const resolver = new ethers.Contract(resolverAddress, resolverABI, provider);

            // Get the name
            const name = await resolver.name(reverseNamehash);
            console.log(`📛 Reverse resolved name: ${name}`);

            return name || null;
        } catch (error) {
            console.error(`❌ Error reverse resolving ${address}:`, error);
            return null;
        }
    }

    /**
     * Get supported networks
     */
    getSupportedNetworks(): string[] {
        return Object.keys(this.networks);
    }

    /**
     * Check if a network is supported
     */
    isNetworkSupported(network: string): boolean {
        return network in this.networks;
    }
}
