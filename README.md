# Zap

Zap (formerly intended as `@rootstock-kits/zap`) is a production-ready "Zapper" widget and SDK for Rootstock. It streamlines Bitcoin DeFi onboarding by seamlessly combining the Rootstock [Flyover SDK](https://github.com/rsksmart/flyover-sdk) and [RSK Swap SDK](https://github.com/rsksmart/rsk-swap-sdk) into a single, automated user flow.

## Features

- **SDK Orchestration**: Combines the `@rsksmart/flyover-sdk` (for the bridge) and `@rsksmart/rsk-swap-sdk` (for the swap) into a single, unified state machine.
- **The "Zap" Hook**: Provides a `useZapIn()` hook that effortlessly calculates the bridge fee and swap slippage up-front, yielding a final "Estimated Output" before deposit.
- **Smart UI Component**: A drop-in `<ZapWidget />` component that generates the BTC deposit address natively and actively listens for the "Peg-in" network event.
- **Auto-Execution (The "Awe" Factor)**: Once the RBTC arrives on-chain, the widget automatically detects it and immediately prompts the user to sign the swap transaction, providing an entirely frictionless cross-chain experience.

## Installation

```bash
npm install zap @rsksmart/flyover-sdk @rsksmart/rsk-swap-sdk
```
*(Ensure you have `react` and `react-dom` installed in your project as well)*

## Quick Start

### Using the UI Widget

For the fastest integration, use the built-in React component:

```tsx
import { ZapWidget, FlyoverAdapter, SwapAdapter } from 'zap';

function App() {
  // Pass in the adapters required for orchestration
  const zapConfig = {
    flyover: new FlyoverAdapter('Testnet'),
    swap: new SwapAdapter(window.ethereum, 'Testnet')
  };

  return (
    <div className="App">
      <h2>Onboard to Rootstock</h2>
      <ZapWidget config={zapConfig} />
    </div>
  );
}
```

### Using the Hook (Headless)

If you need complete control over the UI, use the `useZapIn` hook:

```tsx
import { useZapIn, FlyoverAdapter, SwapAdapter } from 'zap';

function CustomZap() {
  const zapConfig = {
    flyover: new FlyoverAdapter('Testnet'),
    swap: new SwapAdapter(window.ethereum, 'Testnet')
  };

  const { estimate, deposit, state, error } = useZapIn(zapConfig);

  const handleZap = async () => {
    try {
        // 1. Get exact estimated tokens using bridge + swap slippage
        await estimate(100000n, 'RIF'); 
        // 2. Start the deposit tracking & auto-execution
        deposit();
    } catch (e) {
        console.error("Zap estimation failed!", e);
    }
  }

  return (
    <div>
      <p>Current Status: {state}</p>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      <button onClick={handleZap} disabled={state !== 'IDLE'}>
        Start Zap
      </button>
    </div>
  );
}
```

## Architecture

Zap is composed of a few core layers:
- **Adapters** (`FlyoverAdapter`, `SwapAdapter`): Abstractions over the raw Rootstock SDKs.
- **State Machine** (`ZapStateMachine`): The core orchestration logic regulating the flow from bridge to swap.
- **Hooks & Components** (`useZapIn`, `ZapWidget`): The React integration layer.

## Development

This project uses `biome` for linting/formatting and `vitest` for testing.

```bash
# Watch mode for building
npm run dev

# Run typechecking
npm run typecheck

# Run linter & formatter
npm run lint

# Run tests
npm run test
```

## License

MIT
