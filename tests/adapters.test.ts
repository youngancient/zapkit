import { describe, expect, test } from 'vitest';
import { FlyoverAdapter, SwapAdapter } from '../src/index.js';

describe('Live Adapters', () => {

    test('FlyoverAdapter sets network config properties cleanly', () => {
        const mainnet = new FlyoverAdapter('Mainnet');
        expect(mainnet.network).toBe('Mainnet');

        const testnet = new FlyoverAdapter('Testnet');
        expect(testnet.network).toBe('Testnet');
    });

    test('SwapAdapter initialization handles unsupplied provider without crashing', async () => {
        // Usually on SSR (like Next.js) or before wallet integration, window.ethereum is undefined
        const adapter = new SwapAdapter(undefined, 'Testnet');
        expect(adapter).toBeDefined();

        // But attempting to fetch a quote abruptly without the proper provider will throw
        await expect(adapter.getQuote(100n, 'RIF')).rejects.toThrowError(/not fully initialized/);
    });

    test('SwapAdapter executeSwap safely aborts when uninitialized', async () => {
        const adapter = new SwapAdapter();
        await expect(adapter.executeSwap(200n, 'USD')).rejects.toThrowError(/SDK not initialized/);
    });

});
