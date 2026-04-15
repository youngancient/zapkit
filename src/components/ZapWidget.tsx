import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useZapIn } from '../hooks/useZapIn.js';
import type { ZapConfig } from '../machine/ZapStateMachine.js';

export interface ZapWidgetProps {
    config: ZapConfig;
    isConnected?: boolean;
    onConnect?: () => void;
    onStateChange?: (state: string) => void;
}

export const ZapWidget: React.FC<ZapWidgetProps> = ({ config, isConnected = true, onConnect, onStateChange }) => {
    const zap = useZapIn(config);
    const [btcAmount, setBtcAmount] = useState<string>('0.1');

    React.useEffect(() => {
        if (onStateChange) onStateChange(zap.state);
    }, [zap.state, onStateChange]);
    const [targetProtocol, setTargetProtocol] = useState<string>('RIF');

    const handleEstimate = () => {
        if (!btcAmount || isNaN(Number(btcAmount))) return;
        const sats = BigInt(Math.floor(Number(btcAmount) * 1e8));
        zap.estimate(sats, targetProtocol);
    };

    const formatBtc = (sats: bigint) => (Number(sats) / 1e8).toFixed(4);
    const formatToken = (amount: bigint) => (Number(amount) / 1e8).toLocaleString();

    return (
        <div className="w-full max-w-[420px] mx-auto p-8 bg-[#151515]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(255,145,0,0.15)] border border-white/10 flex flex-col gap-6 font-sans text-white relative overflow-hidden transition-all">
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[2rem]"></div>

            <h2 className="text-2xl font-black tracking-tight text-center relative z-10">Zap to Rootstock</h2>

            {zap.state === 'IDLE' && (
                <div className="flex flex-col gap-5 relative z-10 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-400 tracking-wide uppercase">Bitcoin to Deposit</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.1"
                            className="p-4 bg-black/50 border border-white/10 rounded-2xl outline-none focus:border-[#FF9100] focus:ring-1 focus:ring-[#FF9100] font-mono text-2xl transition-all shadow-inner text-white placeholder-gray-600"
                            value={btcAmount}
                            onChange={(e) => setBtcAmount(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-400 tracking-wide uppercase">Target Token</label>
                        <select
                            className="p-4 bg-black/50 border border-white/10 rounded-2xl outline-none focus:border-[#FF9100] focus:ring-1 focus:ring-[#FF9100] font-bold text-lg text-white transition-all appearance-none"
                            value={targetProtocol}
                            onChange={(e) => setTargetProtocol(e.target.value)}
                        >
                            <option value="RIF">RIF Token</option>
                            <option value="USDT">USDT on Rootstock</option>
                        </select>
                    </div>

                    <button
                        className={`mt-4 p-4 ${isConnected ? 'bg-gradient-to-r from-[#FF9100] to-[#E68200] hover:scale-[1.02] active:scale-95 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'} font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(255,145,0,0.3)]`}
                        onClick={isConnected ? handleEstimate : (onConnect ? onConnect : undefined)}
                    >
                        {isConnected ? "Get Quote" : "Connect Wallet"}
                    </button>

                    {zap.flyoverQuote && zap.swapQuote && (
                        <div className="p-5 bg-black/40 rounded-2xl flex flex-col gap-3 mt-2 border border-white/10 text-sm backdrop-blur-md">
                            <h3 className="font-bold text-gray-300 uppercase tracking-widest text-xs mb-1">Execution Summary</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Bridge Fee</span>
                                <span className="font-mono text-red-400/90 font-semibold">-{formatBtc(zap.flyoverQuote.feeBtc)} BTC</span>
                            </div>
                            <div className="flex justify-between font-black text-white border-t border-white/10 pt-3 mt-1 items-center">
                                <span className="text-base text-gray-200">You Receive</span>
                                <span className="font-mono text-[#FF9100] text-lg drop-shadow-md">{formatToken(zap.swapQuote.expectedTokenAmount)} {targetProtocol}</span>
                            </div>
                            <button
                                className={`mt-5 p-4 ${isConnected ? 'bg-white hover:bg-gray-200 text-black' : 'bg-gray-700 text-gray-500 cursor-not-allowed'} font-black uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
                                onClick={isConnected ? zap.deposit : undefined}
                                disabled={!isConnected}
                            >
                                Start Deposit
                            </button>
                        </div>
                    )}
                </div>
            )}

            {zap.state === 'ESTIMATING' && (
                <div className="flex flex-col justify-center items-center py-16 text-[#FF9100] font-semibold animate-pulse tracking-wide relative z-10">
                    <div className="w-10 h-10 border-4 border-[#FF9100]/30 border-t-[#FF9100] rounded-full animate-spin mb-4"></div>
                    Routing via RSK Swap...
                </div>
            )}

            {zap.state === 'AWAITING_DEPOSIT' && zap.flyoverQuote && (
                <div className="flex flex-col items-center gap-5 py-6 animate-in slide-in-from-right duration-500 relative z-10">
                    <p className="text-center text-sm font-semibold text-gray-400 tracking-wide">
                        SEND EXACTLY <br /><span className="text-2xl text-white font-black mt-1 inline-block drop-shadow-md">{formatBtc(zap.btcInput)} BTC</span>
                    </p>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-inner">
                        <div className="w-48 h-48 bg-white/90 border-4 border-transparent rounded-2xl flex items-center justify-center relative overflow-hidden group p-2">
                            <QRCodeSVG value={zap.flyoverQuote.depositAddress} size={176} fgColor="#111" bgColor="transparent" />
                        </div>
                    </div>
                    <span className="font-mono bg-black/50 p-3 rounded-xl text-xs break-all border border-white/10 w-full text-center text-gray-300 shadow-inner">
                        {zap.flyoverQuote.depositAddress}
                    </span>

                    <div className="mt-2 flex items-center justify-center gap-3 text-sm text-[#FF9100] bg-[#FF9100]/10 border border-[#FF9100]/20 p-4 rounded-xl w-full font-medium">
                        <span className="animate-spin text-xl drop-shadow">⏳</span>
                        Awaiting 1 Block Conf.
                    </div>

                    <button onClick={zap.simulatePegIn} className="text-[10px] tracking-widest uppercase text-gray-500 hover:text-[#FF9100] font-bold transition-colors mt-2">
                        [ Dev: Force Peg-In ]
                    </button>
                </div>
            )}

            {zap.state === 'PEG_IN_DETECTED' && (
                <div className="flex flex-col items-center gap-6 py-6 animate-in zoom-in duration-300 relative z-10">
                    <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 text-green-400 rounded-full flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        ⚡
                    </div>
                    <div className="text-center">
                        <h3 className="font-black text-2xl text-white drop-shadow">RBTC Arrived!</h3>
                        <p className="text-sm font-medium text-gray-400 mt-2">Peg-in successful. Ready to swap to {zap.targetToken}.</p>
                    </div>

                    <button
                        className="w-full mt-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-[1.02] active:scale-95 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] text-base"
                        onClick={zap.executeSwap}
                    >
                        Sign Swap Tx
                    </button>
                    <button onClick={zap.reset} className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors mt-2">Start Over</button>
                </div>
            )}

            {zap.state === 'SWAPPING' && (
                <div className="flex flex-col items-center justify-center gap-6 py-16 animate-pulse relative z-10">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <p className="font-bold text-indigo-300 tracking-wide uppercase text-sm">Executing RSK Swap...</p>
                </div>
            )}

            {zap.state === 'COMPLETED' && (
                <div className="flex flex-col items-center gap-5 py-8 animate-in slide-in-from-bottom duration-500 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(52,211,153,0.5)]">
                        ✓
                    </div>
                    <h3 className="text-3xl font-black text-white drop-shadow-md">Zapped!</h3>
                    <p className="text-center text-base font-medium text-gray-300">
                        Successfully obtained <b className="text-[#FF9100] drop-shadow">{zap.swapQuote ? formatToken(zap.swapQuote.expectedTokenAmount) : ''} {zap.targetToken}</b> via RSK Swap.
                    </p>
                    {zap.txHash && (
                        <div className="w-full mt-2">
                            <a href={`https://explorer.rootstock.io/tx/${zap.txHash}`} target="_blank" rel="noreferrer" className="block text-center text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 text-xs font-mono break-all bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl transition-colors">
                                Tx: {zap.txHash.slice(0, 24)}...
                            </a>
                        </div>
                    )}
                    <button
                        className="mt-6 p-4 w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-2xl transition-colors border border-white/20"
                        onClick={zap.reset}
                    >
                        New Zap
                    </button>
                </div>
            )}

            {zap.state === 'ERROR' && (
                <div className="flex flex-col items-center gap-5 py-6 animate-in slide-in-from-top duration-300 relative z-10">
                    <div className="p-5 w-full bg-red-500/10 text-red-400 rounded-2xl font-bold text-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                        ⚠ {zap.error}
                    </div>
                    <button
                        className="p-4 w-full bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest rounded-2xl transition-colors shadow-lg"
                        onClick={zap.reset}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};
