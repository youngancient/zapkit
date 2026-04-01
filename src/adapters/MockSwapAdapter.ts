import type { ISwapAdapter, SwapQuote } from './types.js';

export class MockSwapAdapter implements ISwapAdapter {
    async getQuote(rbtcAmount: bigint, _targetToken: string): Promise<SwapQuote> {
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mocking an exchange rate: 1 RBTC = 50,000 Token (e.g. RIF or Stablecoin)
        const exchangeRate = 50000n;
        const expectedTokenAmount = rbtcAmount * exchangeRate;

        return {
            expectedTokenAmount,
            slippagePercent: 0.5,
        };
    }

    async executeSwap(_rbtcAmount: bigint, _targetToken: string, _signer?: any): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Return a mocked tx hash
        return '0xmockedtxhash1234567890abcdef1234567890abcdef1234567890abcdef1234';
    }
}
