import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ENSResolver } from './services/ensResolver.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize ENS resolver
const ensResolver = new ENSResolver();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ENS API Server'
    });
});

// Resolve ENS name endpoint
app.get('/resolve/:domainName', async (req, res) => {
    try {
        const { domainName } = req.params;
        const { network = 'mainnet' } = req.query;

        if (!domainName) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain name'
            });
        }

        const result = await ensResolver.resolveName(domainName, network as string);

        if (result) {
            res.json({
                success: true,
                data: {
                    name: domainName,
                    address: result,
                    network: network
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Domain not found or not resolved'
            });
        }
    } catch (error) {
        console.error('Error resolving domain:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get domain info endpoint
app.get('/domain/:domainName', async (req, res) => {
    try {
        const { domainName } = req.params;
        const { network = 'mainnet' } = req.query;

        if (!domainName) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain name'
            });
        }

        const result = await ensResolver.getDomainInfo(domainName, network as string);

        if (result) {
            res.json({
                success: true,
                data: result
            });
        } else {
            res.json({
                success: false,
                error: 'Domain not found'
            });
        }
    } catch (error) {
        console.error('Error getting domain info:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Reverse lookup endpoint
app.get('/reverse/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { network = 'mainnet' } = req.query;

        if (!address || !address.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address format'
            });
        }

        const result = await ensResolver.reverseResolve(address, network as string);

        if (result) {
            res.json({
                success: true,
                data: {
                    address: address,
                    name: result,
                    network: network
                }
            });
        } else {
            res.json({
                success: false,
                error: 'No ENS name found for this address'
            });
        }
    } catch (error) {
        console.error('Error reverse resolving:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 ENS API Server running on port ${port}`);
    console.log(`📡 Available networks: mainnet, sepolia`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`📋 API docs:`);
    console.log(`   GET /resolve/:domainName?network=mainnet`);
    console.log(`   GET /domain/:domainName?network=mainnet`);
    console.log(`   GET /reverse/:address?network=mainnet`);
});

export default app;
