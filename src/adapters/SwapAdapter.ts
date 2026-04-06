import { RskSwapSDK } from '@rsksmart/rsk-swap-sdk';
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk';
import type { ISwapAdapter, SwapQuote } from './types.js';

export class SwapAdapter implements ISwapAdapter {
    private sdk?: RskSwapSDK;
    private connection?: BlockchainConnection;

    private chainId: string;

    /**
     * @param provider An external provider like window.ethereum
     * @param network The target network for RSK Swap (Mainnet, Testnet)
     */
    constructor(provider?: any, public network: 'Testnet' | 'Mainnet' = 'Testnet') {
        this.chainId = network === 'Testnet' ? '31' : '30';
        if (provider) {
            BlockchainConnection.createUsingStandard(provider)
                .then((bc: BlockchainConnection) => {
                    this.connection = bc;
                    this.sdk = new RskSwapSDK(this.network, this.connection);
                })
                .catch(console.error);
        }
    }

    async getQuote(rbtcAmount: bigint, targetToken: string): Promise<SwapQuote> {
        if (!this.sdk) {
            throw new Error("SwapAdapter SDK not fully initialized with a provider. Cannot fetch live quotes.");
        }

        try {
            // RSK Testnet ChainId is 31
            const estimations = await this.sdk.estimateSwap({
                fromChainId: this.chainId,
                toChainId: this.chainId,
                fromToken: 'RBTC',
                toToken: targetToken,
                fromAmount: rbtcAmount
            });

            const best = Array.isArray(estimations) ? estimations[0] : estimations;

            return {
                expectedTokenAmount: BigInt(best?.total || 0),
                slippagePercent: 0.5, // Slippage not provided by API directly, use default 0.5%
            };
        } catch (error) {
            console.error("Failed to estimate swap:", error);
            throw new Error("Swap estimation failed");
        }
    }

    async executeSwap(rbtcAmount: bigint, targetToken: string, signer?: any): Promise<string> {
        if (!this.sdk || !this.connection) {
            throw new Error("SDK not initialized. Pass window.ethereum or a provider to SwapAdapter.");
        }

        try {
            // Re-fetch estimation to get the provider id
            const estimations = await this.sdk.estimateSwap({
                fromChainId: this.chainId,
                toChainId: this.chainId,
                fromToken: 'RBTC',
                toToken: targetToken,
                fromAmount: rbtcAmount
            });
            const best = Array.isArray(estimations) ? estimations[0] : estimations;

            if (!best) {
                throw new Error("No provider found to execute swap");
            }

            // Attempt to resolve address from signer or connection
            let userAddress = '';
            if (signer && typeof signer.getAddress === 'function') {
                userAddress = await signer.getAddress();
            } else {
                userAddress = await this.connection.getConnectedAddress();
            }

            const newSwap = await this.sdk.createNewSwap({
                providerId: best.providerId,
                fromNetwork: this.chainId,
                toNetwork: this.chainId,
                fromToken: 'RBTC',
                toToken: targetToken,
                fromAmount: rbtcAmount,
                address: userAddress,
                refundAddress: userAddress
            });

            const txHash = await this.sdk.executeSwap(newSwap.action);
            return txHash;
        } catch (error) {
            console.error("Failed to execute swap:", error);
            throw error;
        }
    }
}
