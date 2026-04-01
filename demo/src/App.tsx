import { ZapWidget, MockFlyoverAdapter, MockSwapAdapter } from 'zapkit';

function App() {
  const config = {
    flyover: new MockFlyoverAdapter(),
    swap: new MockSwapAdapter()
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#FF9100]/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF9100]/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 mb-12 flex flex-col items-center text-center max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
          Enter <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF9100] to-yellow-400 animate-gradient-x">Rootstock</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-medium tracking-wide leading-relaxed max-w-xl">
          The ultimate Bitcoin DeFi portal. Zap your native <b className="text-white drop-shadow">BTC</b> directly into <b className="text-white drop-shadow">RIF</b> or <b className="text-white drop-shadow">USDT</b> seamlessly inside one frictionless flow.
        </p>
      </div>

      <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both w-full flex justify-center">
        <ZapWidget config={config} />
      </div>

      <div className="absolute bottom-8 text-gray-600 text-xs font-mono select-none tracking-widest uppercase opacity-70">
        Powered by Flyover & RSK Swap SDKs
      </div>
    </div>
  );
}

export default App;
