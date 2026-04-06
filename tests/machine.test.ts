import { describe, expect, test, vi } from 'vitest';
import { ZapStateMachine } from '../src/machine/ZapStateMachine.js';
import type { IFlyoverAdapter, ISwapAdapter } from '../src/adapters/types.js';

describe('ZapStateMachine Core Behavior', () => {
    const createMockAdapters = () => {
        const flyover: IFlyoverAdapter = {
            getQuote: vi.fn().mockResolvedValue({ feeBtc: 1n, expectedRbtc: 99n, depositAddress: 'bc1mock' }),
            onPegIn: vi.fn().mockReturnValue(() => { }),
        };

        const swap: ISwapAdapter = {
            getQuote: vi.fn().mockResolvedValue({ expectedTokenAmount: 5000n, slippagePercent: 1 }),
            executeSwap: vi.fn().mockResolvedValue('0xMockTxHash'),
        };

        return { flyover, swap };
    };

    test('successfully progresses quote estimates and loads states', async () => {
        const mocks = createMockAdapters();
        const machine = new ZapStateMachine({ flyover: mocks.flyover, swap: mocks.swap });

        expect(machine.getState()).toBe('IDLE');

        await machine.estimateZap(150n, 'RIF');

        expect(mocks.flyover.getQuote).toHaveBeenCalledWith(150n, '0xUserAddress');
        expect(mocks.swap.getQuote).toHaveBeenCalledWith(99n, 'RIF');

        // Reverts to idle awaiting manual "startDeposit" confirmation
        expect(machine.getState()).toBe('IDLE');
        expect(machine.flyoverQuote?.expectedRbtc).toBe(99n);
        expect(machine.swapQuote?.expectedTokenAmount).toBe(5000n);
    });

    test('startDeposit transitions rigidly to AWAITING_DEPOSIT', async () => {
        const mocks = createMockAdapters();
        const machine = new ZapStateMachine({ flyover: mocks.flyover, swap: mocks.swap });

        machine.startDeposit();
        // Verify it doesn't change if quote isn't loaded
        expect(machine.getState()).toBe('IDLE');

        await machine.estimateZap(100n, 'RIF');
        machine.startDeposit();
        expect(machine.getState()).toBe('AWAITING_DEPOSIT');
    });

    test('executeSwap fails explicitly if PEG_IN is not confirmed yet', async () => {
        const mocks = createMockAdapters();
        const machine = new ZapStateMachine({ flyover: mocks.flyover, swap: mocks.swap });

        await machine.estimateZap(100n, 'RIF');
        machine.startDeposit(); // AWAITING_DEPOSIT

        // Attempting premature execution
        await machine.executeSwap();
        expect(machine.getState()).toBe('AWAITING_DEPOSIT');
        expect(mocks.swap.executeSwap).not.toHaveBeenCalled();
    });

    test('reset effectively cleans all context completely', async () => {
        const mocks = createMockAdapters();
        const machine = new ZapStateMachine({ flyover: mocks.flyover, swap: mocks.swap });

        await machine.estimateZap(250n, 'USD');
        machine.reset();

        expect(machine.getState()).toBe('IDLE');
        expect(machine.btcInput).toBe(0n);
        expect(machine.targetToken).toBe('');
        expect(machine.flyoverQuote).toBeUndefined();
        expect(machine.swapQuote).toBeUndefined();
        expect(machine.txHash).toBeUndefined();
        expect(machine.txHash).toBeUndefined();
        expect(machine.getError()).toBeUndefined();
    });

    test('orchestrates a full conversion flow of 0.1 BTC to RIF', async () => {
        // Equivalent to 10,000,000 satoshis (0.1 BTC)
        const btcTarget = 10_000_000n;
        const expectedRbtc = 9_990_000n;
        const expectedRif = 500_000_000n;

        let simulateDeposit = () => { };

        const flyover: IFlyoverAdapter = {
            getQuote: vi.fn().mockResolvedValue({ feeBtc: 10_000n, expectedRbtc, depositAddress: 'bc1real' }),
            onPegIn: vi.fn().mockImplementation((cb) => {
                simulateDeposit = () => cb(expectedRbtc);
                return () => { };
            }),
        };

        const swap: ISwapAdapter = {
            getQuote: vi.fn().mockResolvedValue({ expectedTokenAmount: expectedRif, slippagePercent: 0.5 }),
            executeSwap: vi.fn().mockResolvedValue('0xFullZapTxHash'),
        };

        const machine = new ZapStateMachine({ flyover, swap });

        // 1. Estimation Phase
        await machine.estimateZap(btcTarget, 'RIF');
        expect(machine.getState()).toBe('IDLE');
        expect(machine.flyoverQuote?.expectedRbtc).toBe(expectedRbtc);
        expect(machine.swapQuote?.expectedTokenAmount).toBe(expectedRif);

        // 2. Flyover Bridging Phase
        machine.startDeposit();
        expect(machine.getState()).toBe('AWAITING_DEPOSIT');

        // 3. User makes BTC deposit and Flyover confirms peg-in (simulated externally)
        simulateDeposit();
        expect(machine.getState()).toBe('PEG_IN_DETECTED');

        // 4. Swap SDK Phase
        await machine.executeSwap();
        expect(machine.getState()).toBe('COMPLETED');
        expect(machine.txHash).toBe('0xFullZapTxHash');
    });

});
