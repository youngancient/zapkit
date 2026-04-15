import React from 'react';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./connection.ts";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { formatAddress } from "./utils.ts";
import { ZapWidget } from "zap";

function App() {
  const { isConnected, address } = useAppKitAccount();

  // controls popup of wallet connect modal
  const { open } = useAppKit();

  const zapConfig = React.useMemo(() => {
    let pegInListener: ((arrived: boolean) => void) | null = null;
    return {
      rpcUrl: "https://public-node.rsk.co",
      flyover: {
        onPegIn: (cb: any) => {
          pegInListener = cb;
          return () => { pegInListener = null; };
        },
        getQuote: async (sats: bigint, addr: string) => ({
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
          // Mock realistic exchange rate: 1 BTC = 50,000 RIF approx
          expectedTokenAmount: token === 'RIF' ? rbtc * 50000n : rbtc * 60000n
        }),
        executeSwap: async () => '0xmocktxhash1234567890abcdef'
      }
    } as any;
  }, []);

  return (
    <>
      <div className="wallet-section">
        <button onClick={() => open()}>
          {isConnected ? formatAddress(address ?? "") : <>Connect Wallet</>}
        </button>
      </div>

      <div className="logo-container">
        <img src="/rootstock.png" className="logo" alt="Rootstock Logo" />
      </div>

      <h1 className="title">Zap Demo</h1>

      <div className="widget-wrapper">
        <ZapWidget config={zapConfig} isConnected={isConnected} onConnect={() => open()} />
      </div>

      <ToastContainer theme="dark" toastStyle={{ backgroundColor: '#151515', color: '#fff', border: '1px solid #333' }} />
    </>
  );
}

export default App;
