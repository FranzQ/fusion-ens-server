import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';

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
            },
            mainnet: {
                rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                ensRegistry: process.env.MAINNET_ENS_REGISTRY || '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
                name: 'Mainnet'
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
     * Parse domain name to handle new format (name.eth:chain) and old format (name.chain)
     * @param domainName - Domain name in either format
     * @returns Object with baseDomain and targetChain
     */
    private parseDomainWithChain(domainName: string): { baseDomain: string, targetChain: string } {
        // Check for new format (name.eth:chain)
        const colonIndex = domainName.lastIndexOf(':');
        if (colonIndex !== -1) {
            const baseDomain = domainName.substring(0, colonIndex);
            const targetChain = domainName.substring(colonIndex + 1);

            // Validate that base domain ends with .eth
            if (!baseDomain.endsWith('.eth')) {
                throw new Error(`Invalid format: base domain must end with .eth in format name.eth:chain`);
            }

            return { baseDomain, targetChain };
        }

        // Handle old format (name.chain) - backward compatibility
        const tld = domainName.split('.').pop();
        if (!tld) {
            throw new Error(`Invalid domain name: ${domainName}`);
        }

        // Check if this is a text record or multi-chain TLD
        const textRecordTypes = ['x', 'url', 'github', 'name', 'bio', 'description', 'avatar', 'header'];
        const multiChainTLDs = ['btc', 'sol', 'doge', 'xrp', 'ltc', 'ada', 'base', 'arbi', 'polygon', 'avax', 'bsc', 'op', 'zora', 'linea', 'scroll', 'mantle', 'celo', 'gnosis', 'fantom'];

        if (textRecordTypes.includes(tld) || multiChainTLDs.includes(tld)) {
            // Convert old format to new format
            const nameWithoutTLD = domainName.replace(`.${tld}`, '');
            const baseDomain = `${nameWithoutTLD}.eth`;
            return { baseDomain, targetChain: tld };
        }

        // For .eth domains, return as-is
        if (tld === 'eth') {
            return { baseDomain: domainName, targetChain: 'eth' };
        }

        // Default to .eth if no specific chain is detected
        return { baseDomain: domainName, targetChain: 'eth' };
    }

    /**
     * Resolve an ENS name to an Ethereum address, multi-chain address, or text record
     * Supports both old format (name.btc) and new format (name.eth:btc)
     */
    async resolveName(domainName: string, network: string = 'mainnet'): Promise<string | null> {
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

            // Parse domain name to handle new format (name.eth:chain)
            const parsed = this.parseDomainWithChain(domainName);
            const baseDomain = parsed.baseDomain;
            const targetChain = parsed.targetChain;

            console.log(`🔍 Resolving: ${domainName} -> Base: ${baseDomain}, Target: ${targetChain}`);

            // Check if this is a text record (like .x, .url, .github, etc.)
            const textRecordTypes = ['x', 'url', 'github', 'name', 'bio', 'description', 'avatar', 'header'];

            if (textRecordTypes.includes(targetChain)) {
                return await this.resolveTextRecord(baseDomain, targetChain, provider, config);
            }

            // Check if this is a multi-chain request (not .eth)
            if (targetChain !== 'eth') {
                return await this.resolveMultiChainTLD(baseDomain, targetChain, provider, config);
            }

            // For .eth domains, resolve directly
            return await this.resolveEthDomain(baseDomain, provider, config);
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
    private async resolveMultiChainTLD(ethDomain: string, targetChain: string, provider: ethers.JsonRpcProvider, config: NetworkConfig): Promise<string | null> {

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

        // Get the coin type for this target chain
        const coinType = this.getCoinType(targetChain);

        if (coinType === 60) {
            // Ethereum address (coin type 60)
            const address = await resolver.addr(namehash);

            if (address === ethers.ZeroAddress) {
                return null;
            }

            return address;
        } else {
            // Multi-chain address using coin type
            console.log(`🔍 Looking up coin type ${coinType} for ${targetChain} in ${ethDomain}`);
            const addressBytes = await resolver['addr(bytes32,uint256)'](namehash, coinType);
            console.log(`📦 Raw address bytes: ${addressBytes}`);

            if (!addressBytes || addressBytes === '0x') {
                console.log(`❌ No address bytes found for coin type ${coinType}`);
                return null;
            }

            // Convert bytes to address string
            const address = this.bytesToAddress(addressBytes, targetChain);
            return address;
        }
    }

    /**
     * Resolve text record from .eth domain
     */
    private async resolveTextRecord(ethDomain: string, textRecordType: string, provider: ethers.JsonRpcProvider, config: NetworkConfig): Promise<string | null> {

        // Create ENS registry contract instance
        const ensRegistry = new ethers.Contract(
            config.ensRegistry,
            [
                'function resolver(bytes32 node) external view returns (address)'
            ],
            provider
        );

        // Create resolver contract ABI for text records
        const resolverABI = [
            'function text(bytes32 node, string key) external view returns (string)'
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

        // Map text record types to ENS text record keys
        const textRecordMap: Record<string, string> = {
            'x': 'com.twitter',
            'url': 'url',
            'github': 'com.github',
            'name': 'name',
            'bio': 'description',
            'description': 'description',
            'avatar': 'avatar',
            'header': 'header'
        };

        const ensTextKey = textRecordMap[textRecordType] || textRecordType;

        try {
            // Get the text record value
            const textValue = await resolver.text(namehash, ensTextKey);

            if (!textValue || textValue === '') {
                return null;
            }

            return textValue;
        } catch (error) {
            console.error(`Error getting text record ${ensTextKey} for ${ethDomain}:`, error);
            return null;
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
        try {
            console.log(`🔧 Decoding ${tld} address from bytes: ${addressBytes}`);

            // For Bitcoin (coin type 0), decode as Bitcoin address
            if (tld === 'btc') {
                const buffer = Buffer.from(addressBytes.slice(2), 'hex');
                console.log(`📊 Bitcoin buffer length: ${buffer.length} bytes`);

                try {
                    // Bitcoin address formats in ENS:
                    // - 20 bytes: P2PKH hash
                    // - 22 bytes: P2WPKH (version + 20 bytes)
                    // - 25 bytes: P2PKH with checksum
                    // - 32 bytes: P2TR taproot

                    if (buffer.length === 20) {
                        // P2PKH legacy format
                        const address = bitcoin.payments.p2pkh({ hash: buffer }).address;
                        if (address) {
                            return address;
                        }
                    } else if (buffer.length === 22) {
                        // P2WPKH bech32 format (version + length + 20 bytes)
                        const version = buffer[0];
                        const length = buffer[1];
                        const hash = buffer.slice(2);
                        if (version === 0 && length === 20 && hash.length === 20) {
                            const address = bitcoin.payments.p2wpkh({ hash }).address;
                            if (address) {
                                return address;
                            }
                        }
                    } else if (buffer.length === 25) {
                        // P2PKH with checksum (already formatted)
                        const address = bitcoin.payments.p2pkh({ output: buffer }).address;
                        if (address) {
                            return address;
                        }
                    } else if (buffer.length === 32) {
                        // P2TR taproot format
                        const address = bitcoin.payments.p2tr({ pubkey: buffer }).address;
                        if (address) {
                            return address;
                        }
                    }

                    // Fallback: try to decode as P2PKH
                    const address = bitcoin.payments.p2pkh({ hash: buffer }).address;
                    if (address) {
                        return address;
                    }
                } catch (btcError) {
                    console.log(`⚠️ Bitcoin decoding failed: ${btcError}`);
                }

                // Ultimate fallback
                return `btc_${buffer.toString('hex')}`;
            }

            // For Solana (coin type 501), decode as Solana address
            if (tld === 'sol') {
                const buffer = Buffer.from(addressBytes.slice(2), 'hex');
                console.log(`📊 Solana buffer length: ${buffer.length} bytes`);

                try {
                    // Solana addresses are 32 bytes
                    if (buffer.length === 32) {
                        const publicKey = new PublicKey(buffer);
                        const address = publicKey.toBase58();
                        return address;
                    }
                } catch (solError) {
                    console.log(`⚠️ Solana decoding failed: ${solError}`);
                }

                // Fallback
                return `sol_${buffer.toString('hex')}`;
            }

            // For Dogecoin (coin type 3), decode as Dogecoin address
            if (tld === 'doge') {
                const buffer = Buffer.from(addressBytes.slice(2), 'hex');
                console.log(`📊 Dogecoin buffer length: ${buffer.length} bytes`);

                try {
                    // Dogecoin network configuration
                    const dogecoinNetwork = {
                        messagePrefix: '\x19Dogecoin Signed Message:\n',
                        bech32: 'doge',
                        bip32: {
                            public: 0x02facafd,
                            private: 0x02fac398
                        },
                        pubKeyHash: 0x1e,
                        scriptHash: 0x16,
                        wif: 0x9e
                    };

                    // Dogecoin uses similar format to Bitcoin but with different network
                    if (buffer.length === 20) {
                        // P2PKH legacy format
                        const address = bitcoin.payments.p2pkh({
                            hash: buffer,
                            network: dogecoinNetwork
                        }).address;
                        if (address) {
                            return address;
                        }
                    } else if (buffer.length === 25) {
                        // P2PKH with checksum (already formatted)
                        const address = bitcoin.payments.p2pkh({
                            output: buffer,
                            network: dogecoinNetwork
                        }).address;
                        if (address) {
                            return address;
                        }
                    }

                    // Fallback: try to decode as P2PKH
                    const address = bitcoin.payments.p2pkh({
                        hash: buffer,
                        network: dogecoinNetwork
                    }).address;
                    if (address) {
                        return address;
                    }
                } catch (dogeError) {
                    console.log(`⚠️ Dogecoin decoding failed: ${dogeError}`);
                }

                // Fallback
                return `doge_${buffer.toString('hex')}`;
            }

            // For Ethereum and similar chains
            if (tld === 'eth' || tld === 'base' || tld === 'arbi' || tld === 'polygon' || tld === 'avax' || tld === 'bsc' || tld === 'op') {
                if (addressBytes.length >= 42) {
                    return ethers.getAddress(addressBytes);
                }
            }

            // For other chains, return as hex string
            return `${tld}_${addressBytes}`;
        } catch (error) {
            console.error(`Error decoding address bytes for ${tld}:`, error);
            return addressBytes;
        }
    }

    /**
     * Get detailed domain information
     */
    async getDomainInfo(domainName: string, network: string = 'mainnet'): Promise<DomainInfo | null> {
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
    async reverseResolve(address: string, network: string = 'mainnet'): Promise<string | null> {
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
