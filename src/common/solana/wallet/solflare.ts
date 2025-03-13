import { Connection, PublicKey, SendOptions, Transaction, TransactionSignature, TransactionVersion, VersionedTransaction } from '@solana/web3.js';
import { ICON_SOLFLARE, isIosAndRedirectable, isVersionedTransaction, PhantomWallet, PhantomWalletAdapterConfig, scopePollingDetectionStrategy, SendTransactionOptions, SolflareWallet, SolflareWalletAdapterConfig, Wallet, WalletReadyState } from './utils';
import Solflare from '@solflare-wallet/sdk';

export class SolflareWalletAdapter implements Wallet {
    name = 'Solflare';
    url = 'https://solflare.com';
    icon = ICON_SOLFLARE;
    supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);

    private _connecting: boolean;
    private _wallet: Solflare | null;
    private _publicKey: PublicKey | null;
    private _config: SolflareWalletAdapterConfig;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.Loadable;

    constructor(config: SolflareWalletAdapterConfig = {}) {
        this._connecting = false;
        this._publicKey = null;
        this._wallet = null;
        this._config = config;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window.solflare?.isSolflare || window.SolflareApp) {
                    this._readyState = WalletReadyState.Installed;
                    // this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
            // detectAndRegisterSolflareMetaMaskWallet();
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get connecting() {
        return this._connecting;
    }

    get connected() {
        return !!this.publicKey;
    }

    get readyState() {
        return this._readyState;
    }

    async autoConnect(): Promise<void> {
        // Skip autoconnect in the Loadable state on iOS
        // We can't redirect to a universal link without user input
        if (!(this.readyState === WalletReadyState.Loadable && isIosAndRedirectable())) {
            await this.connect();
        }
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Loadable && this._readyState !== WalletReadyState.Installed) {
                // throw new WalletNotReadyError();
                return;
            }

            // redirect to the Solflare /browse universal link
            // this will open the current URL in the Solflare in-wallet browser
            if (this.readyState === WalletReadyState.Loadable && isIosAndRedirectable()) {
                const url = encodeURIComponent(window.location.href);
                const ref = encodeURIComponent(window.location.origin);
                window.location.href = `https://solflare.com/ul/v1/browse/${url}?ref=${ref}`;
                return;
            }

            let SolflareClass: typeof Solflare;
            try {
                SolflareClass = (await import('@solflare-wallet/sdk')).default;
            } catch (error: any) {
                return;
                // throw new WalletLoadError(error?.message, error);
            }

            let wallet: Solflare;
            try {
                wallet = new SolflareClass({ network: this._config.network });
            } catch (error: any) {
                // throw new WalletConfigError(error?.message, error);
                return;
            }

            this._connecting = true;

            if (!wallet.connected) {
                try {
                    await wallet.connect();
                } catch (error: any) {
                    // throw new WalletConnectionError(error?.message, error);
                    return;
                }
            }

            if (!wallet.publicKey) {
                // throw new WalletConnectionError();
                return;
            }

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(wallet.publicKey.toBytes());
            } catch (error: any) {
                // throw new WalletPublicKeyError(error?.message, error);
                return;
            }

            wallet.on('disconnect', this._disconnected);
            wallet.on('accountChanged', this._accountChanged);

            this._wallet = wallet;
            this._publicKey = publicKey;

            // this.emit('connect', publicKey);
        } catch (error: any) {
            // this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);
            wallet.off('accountChanged', this._accountChanged);

            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                // this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }

        // this.emit('disconnect');
    }

    protected async prepareTransaction(
        transaction: Transaction,
        connection: Connection,
        options: SendOptions = {}
    ): Promise<Transaction> {
        const publicKey = this.publicKey;
        if (!publicKey) throw new Error();

        transaction.feePayer = transaction.feePayer || publicKey;
        transaction.recentBlockhash =
            transaction.recentBlockhash ||
            (
                await connection.getLatestBlockhash({
                    commitment: options.preflightCommitment,
                    minContextSlot: options.minContextSlot,
                })
            ).blockhash;

        return transaction;
    }
    
    async sendTransaction<T extends Transaction | VersionedTransaction>(
        transaction: T,
        connection: Connection,
        options: SendTransactionOptions = {}
    ): Promise<TransactionSignature> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new Error();

            try {
                const { signers, ...sendOptions } = options;

                if (isVersionedTransaction(transaction)) {
                    signers?.length && transaction.sign(signers);
                } else {
                    transaction = (await this.prepareTransaction(transaction, connection, sendOptions)) as T;
                    signers?.length && (transaction as Transaction).partialSign(...signers);
                }

                sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;

                return await wallet.signAndSendTransaction(transaction, sendOptions);
            } catch (error: any) {
                throw error;
                // if (error instanceof WalletError) throw error;
                // throw new WalletSendTransactionError(error?.message, error);
            }
        } catch (error: any) {
            // this.emit('error', error);
            throw error;
        }
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const wallet = this._wallet;
            if (!wallet) {
                throw new Error();
                // throw new WalletNotConnectedError();
            }

            try {
                return ((await wallet.signTransaction(transaction)) as T) || transaction;
            } catch (error: any) {
                throw new Error(error?.message, error);
                // throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            // this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        try {
            const wallet = this._wallet;
            if (!wallet) {
                throw new Error();
                // throw new WalletNotConnectedError();
            }

            try {
                return ((await wallet.signAllTransactions(transactions)) as T[]) || transactions;
            } catch (error: any) {
                throw new Error(error?.message, error);
                // throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            // this.emit('error', error);
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet) {
                throw new Error();
                // throw new WalletNotConnectedError();
            }

            try {
                return await wallet.signMessage(message, 'utf8');
            } catch (error: any) {
                throw new Error(error?.message, error);
                // throw new WalletSignMessageError(error?.message, error);
            }
        } catch (error: any) {
            // this.emit('error', error);
            throw error;
        }
    }

    private _disconnected = () => {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            // this.emit('error', new WalletDisconnectedError());
            // this.emit('disconnect');
        }
    };

    private _accountChanged = (newPublicKey?: PublicKey) => {
        if (!newPublicKey) return;

        const publicKey = this._publicKey;
        if (!publicKey) return;

        try {
            newPublicKey = new PublicKey(newPublicKey.toBytes());
        } catch (error: any) {
            // this.emit('error', new WalletPublicKeyError(error?.message, error));
            return;
        }

        if (publicKey.equals(newPublicKey)) return;

        this._publicKey = newPublicKey;
        // this.emit('connect', newPublicKey);
    };
}
