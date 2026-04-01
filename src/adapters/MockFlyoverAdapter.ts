import type { FlyoverQuote, IFlyoverAdapter } from './types.js';

export class MockFlyoverAdapter implements IFlyoverAdapter {
    private pegInCallback: ((rbtcAmount: bigint) => void) | undefined;
    private lastExpectedRbtc = 0n;

    async getQuote(btcAmount: bigint, _destinationHex: string): Promise<FlyoverQuote> {
        await new Promise(resolve => setTimeout(resolve, 800));

        const feeBtc = btcAmount / 1000n; // 0.1% bridge fee using BigInt math
        this.lastExpectedRbtc = btcAmount - feeBtc;

        return {
            feeBtc,
            expectedRbtc: this.lastExpectedRbtc,
            depositAddress: 'bc1qmockdepositaddress1234567890abcdef...',
        };
    }

    onPegIn(callback: (amount: bigint) => void): () => void {
        this.pegInCallback = callback;
        return () => {
            this.pegInCallback = undefined;
        };
    }

    simulatePegIn(): void {
        if (this.pegInCallback && this.lastExpectedRbtc > 0n) {
            this.pegInCallback(this.lastExpectedRbtc);
        }
    }
}
