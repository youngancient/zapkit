import { useState, useEffect, useMemo, useCallback } from 'react';
import { ZapStateMachine, type ZapState, type ZapConfig } from '../machine/ZapStateMachine.js';

export function useZapIn(config: ZapConfig) {
    const machine = useMemo(() => new ZapStateMachine(config), []);
    const [state, setState] = useState<ZapState>(machine.getState());

    useEffect(() => {
        const unsubscribe = machine.subscribe(setState);
        return () => { unsubscribe(); };
    }, [machine]);

    // Hot-swap configuration variables when they change
    useEffect(() => {
        machine.flyover = config.flyover;
        machine.swap = config.swap;
        machine.signer = config.signer;
    }, [config, machine]);

    // Automatically start the machine and teardown on unmount
    useEffect(() => {
        machine.start();
        return () => { machine.abort(); };
    }, [machine]);

    const estimate = useCallback(async (btcAmount: bigint, targetToken: string) => {
        await machine.estimateZap(btcAmount, targetToken);
    }, [machine]);

    const deposit = useCallback(() => {
        machine.startDeposit();
    }, [machine]);

    const executeSwap = useCallback(async () => {
        await machine.executeSwap();
    }, [machine]);

    const simulatePegIn = useCallback(() => {
        machine.simulateDeposit();
    }, [machine]);

    const reset = useCallback(() => {
        machine.reset();
    }, [machine]);

    return {
        state,
        machine,
        btcInput: machine.btcInput,
        targetToken: machine.targetToken,
        flyoverQuote: machine.flyoverQuote,
        swapQuote: machine.swapQuote,
        txHash: machine.txHash,
        error: machine.getError(),
        estimate,
        deposit,
        executeSwap,
        simulatePegIn,
        reset
    };
}
