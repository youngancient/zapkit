export interface FlyoverQuote {
    feeBtc: bigint;
    expectedRbtc: bigint;
    depositAddress: string;
}

export interface SwapQuote {
    expectedTokenAmount: bigint;
    slippagePercent: number;
}

export interface IFlyoverAdapter {
    getQuote(btcAmount: bigint, destinationHex: string): Promise<FlyoverQuote>;
    onPegIn(callback: (rbtcAmount: bigint) => void): () => void;
    simulatePegIn?(): void;
}

export interface ISwapAdapter {
    getQuote(rbtcAmount: bigint, targetToken: string): Promise<SwapQuote>;
    executeSwap(rbtcAmount: bigint, targetToken: string, signer?: any): Promise<string>;
}
