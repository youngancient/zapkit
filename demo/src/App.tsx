import React, { useState } from 'react';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./connection.ts";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { formatAddress } from "./utils.ts";
import { ZapWidget, FlyoverAdapter, SwapAdapter } from "zap";

function App() {
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [useLiveTestnet, setUseLiveTestnet] = useState(false);
  const [zapState, setZapState] = useState<string>('IDLE');

  const isBusy = zapState !== 'IDLE' && zapState !== 'COMPLETED' && zapState !== 'ERROR';

  // controls popup of wallet connect modal
  const { open } = useAppKit();

  const zapConfig = React.useMemo(() => {
    if (useLiveTestnet) {
      return {
        rpcUrl: "https://public-node.rsk.co",
        flyover: new FlyoverAdapter('Testnet'),
        swap: new SwapAdapter(walletProvider, 'Testnet'),
      };
    }

    // Mock Mode
    let pegInListener: ((arrived: boolean) => void) | null = null;
    return {
      rpcUrl: "https://public-node.rsk.co",
      flyover: {
        onPegIn: (cb: any) => {
          pegInListener = cb;
          const timer = setInterval(() => {
            if (pegInListener) pegInListener(true);
          }, 3000);
          return () => {
            pegInListener = null;
            clearInterval(timer);
          };
        },
        getQuote: async (sats: bigint, _addr: string) => ({
          expectedRbtc: sats,
          feeBtc: 150000n, // 0.0015 BTC fee
          depositAddress: 'bc1qmockp2tr000t7raddressforqrgenerationmock'
        }),
        simulatePegIn: () => {
          if (pegInListener) pegInListener(true);
        }
      },
      swap: {
        getQuote: async (rbtc: bigint, token: string) => ({
          expectedTokenAmount: token === 'RIF' ? rbtc * 50000n : rbtc * 60000n
        }),
        executeSwap: async () => '0xmocktxhash1234567890abcdef'
      }
    } as any;
  }, [walletProvider, useLiveTestnet]);

  return (
    <>
      <div className="absolute top-8 left-8 z-50 flex items-center space-x-5">
        <button
          onClick={() => setUseLiveTestnet(false)}
          disabled={isBusy}
          className={`px-6 py-2.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all duration-300 border-2 ${isBusy ? 'opacity-40 cursor-not-allowed' : ''} ${!useLiveTestnet
            ? 'border-transparent bg-[#FF9100] text-black ring-2 ring-offset-4 ring-offset-[#151515] ring-[#FF9100] shadow-[0_0_20px_rgba(255,145,0,0.6)]'
            : 'border-white/20 bg-transparent text-white hover:border-white/40'
            }`}
        >
          Mock
        </button>
        <button
          onClick={() => setUseLiveTestnet(true)}
          disabled={isBusy}
          className={`px-6 py-2.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all duration-300 border-2 ${isBusy ? 'opacity-40 cursor-not-allowed' : ''} ${useLiveTestnet
            ? 'border-transparent bg-blue-500 text-white ring-2 ring-offset-4 ring-offset-[#151515] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]'
            : 'border-white/20 bg-transparent text-white hover:border-white/40'
            }`}
        >
          Testnet
        </button>
      </div>
      <div className="wallet-section">
        <button className="primary-btn" onClick={() => open()}>
          {isConnected ? formatAddress(address ?? "") : <>Connect Wallet</>}
        </button>
      </div>

      <div className="logo-container">
        <img src="/rootstock.png" className="logo" alt="Rootstock Logo" />
      </div>

      <h1 className="title">Zap Demo</h1>

      <div className="widget-wrapper">
        <ZapWidget config={zapConfig} isConnected={isConnected} onConnect={() => open()} onStateChange={setZapState} />
      </div>

      <ToastContainer theme="dark" toastStyle={{ backgroundColor: '#151515', color: '#fff', border: '1px solid #333' }} />
    </>
  );
}

export default App;
