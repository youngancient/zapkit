import type { FlyoverQuote, IFlyoverAdapter, ISwapAdapter, SwapQuote } from '../adapters/types.js';

export type ZapState = 'IDLE' | 'ESTIMATING' | 'AWAITING_DEPOSIT' | 'PEG_IN_DETECTED' | 'SWAPPING' | 'COMPLETED' | 'ERROR';

export interface ZapConfig {
    flyover: IFlyoverAdapter;
    swap: ISwapAdapter;
    signer?: any; // Wallet signer instance, e.g. from Ethers or Viem
}

export class ZapStateMachine {
    private state: ZapState = 'IDLE';
    public flyover: IFlyoverAdapter;
    public swap: ISwapAdapter;
    public signer?: any;

    private stateListeners: Set<(state: ZapState) => void> = new Set();
    private errorMsg: string | undefined;
    private unsubscribePegIn: (() => void) | undefined;

    // Ephemeral context
    public btcInput = 0n;
    public targetToken = '';
    public flyoverQuote: FlyoverQuote | undefined;
    public swapQuote: SwapQuote | undefined;
    public txHash: string | undefined;

    constructor(config: ZapConfig) {
        this.flyover = config.flyover;
        this.swap = config.swap;
        this.signer = config.signer;
    }

    public start() {
        if (!this.unsubscribePegIn) {
            this.unsubscribePegIn = this.flyover.onPegIn((_rbtcArrived) => {
                if (this.state === 'AWAITING_DEPOSIT') {
                    this.transition('PEG_IN_DETECTED');
                }
            });
        }
    }

    public subscribe(listener: (state: ZapState) => void) {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
    }

    private transition(newState: ZapState, error?: string) {
        this.state = newState;
        if (error) this.errorMsg = error;

        // Safety Wrapper: Unsafe State listeners (try/catch fix)
        this.stateListeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (e) {
                console.error('Zapper Listener Error:', e);
            }
        });
    }

    public getState() { return this.state; }
    public getError() { return this.errorMsg; }

    public async estimateZap(btcAmount: bigint, tokenTarget: string, destinationHex = '0xUserAddress') {
        try {
            this.transition('ESTIMATING');
            this.btcInput = btcAmount;
            this.targetToken = tokenTarget;

            this.flyoverQuote = await this.flyover.getQuote(btcAmount, destinationHex);
            this.swapQuote = await this.swap.getQuote(this.flyoverQuote.expectedRbtc, tokenTarget);

            this.transition('IDLE');
        } catch (err: any) {
            this.transition('ERROR', err.message || 'Estimation failed');
        }
    }

    public startDeposit() {
        if (this.state !== 'IDLE' || !this.flyoverQuote) return;
        this.transition('AWAITING_DEPOSIT');
    }

    public async executeSwap() {
        if (this.state !== 'PEG_IN_DETECTED' || !this.flyoverQuote) return;

        try {
            this.transition('SWAPPING');
            this.txHash = await this.swap.executeSwap(this.flyoverQuote.expectedRbtc, this.targetToken, this.signer);
            this.transition('COMPLETED');
        } catch (err: any) {
            this.transition('ERROR', err.message || 'Swap failed');
        }
    }

    // Error recovery: wipe the state back to baseline
    public reset() {
        this.btcInput = 0n;
        this.targetToken = '';
        this.flyoverQuote = undefined;
        this.swapQuote = undefined;
        this.txHash = undefined;
        this.errorMsg = undefined;
        this.transition('IDLE');
    }

    // System resource cleanup, e.g. closing websockets
    public abort() {
        if (this.unsubscribePegIn) {
            this.unsubscribePegIn();
            this.unsubscribePegIn = undefined;
        }
        this.reset();
    }

    public simulateDeposit() {
        if (this.flyover.simulatePegIn) {
            this.flyover.simulatePegIn();
        }
    }
}
