import type {
    Connection,
    SendOptions,
    Transaction,
    TransactionSignature,
    TransactionVersion,
    VersionedTransaction,
} from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { ICON_PHANTOM, isVersionedTransaction, PhantomWallet, PhantomWalletAdapterConfig, scopePollingDetectionStrategy, SendTransactionOptions, Wallet, WalletReadyState } from './utils';

export function isIosAndRedirectable() {
    // SSR: return false
    if (!navigator) return false;

    const userAgent = navigator.userAgent.toLowerCase();

    // if on iOS the user agent will contain either iPhone or iPad
    // caveat: if requesting desktop site then this won't work
    const isIos = userAgent.includes('iphone') || userAgent.includes('ipad');

    // if in a webview then it will not include Safari
    // note that other iOS browsers also include Safari
    // so we will redirect only if Safari is also included
    const isSafari = userAgent.includes('safari');

    return isIos && isSafari;
}

export class PhantomWalletAdapter implements Wallet {
    name = 'Phantom';
    url = 'https://phantom.app';
    icon = ICON_PHANTOM;
    supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);

    private _callbacks: any = {};
    private _connecting: boolean;
    private _wallet: PhantomWallet | null;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor(config: PhantomWalletAdapterConfig = {}) {
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;

        if (this._readyState !== WalletReadyState.Unsupported) {
            if (isIosAndRedirectable()) {
                // when in iOS (not webview), set Phantom as loadable instead of checking for install
                this._readyState = WalletReadyState.Loadable;
            } else {
                scopePollingDetectionStrategy(() => {
                    if (window.phantom?.solana?.isPhantom || window.solana?.isPhantom) {
                        this._readyState = WalletReadyState.Installed;
                        return true;
                    }
                    return false;
                });
            }
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    get connected() {
        return !!this.publicKey;
    }

    async autoConnect(): Promise<void> {
        // Skip autoconnect in the Loadable state
        // We can't redirect to a universal link without user input
        if (this.readyState === WalletReadyState.Installed) {
            await this.connect();
        }
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;

            if (this.readyState === WalletReadyState.Loadable) {
                // redirect to the Phantom /browse universal link
                // this will open the current URL in the Phantom in-wallet browser
                const url = encodeURIComponent(window.location.href);
                const ref = encodeURIComponent(window.location.origin);
                window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
                return;
            }

            if (this.readyState !== WalletReadyState.Installed) return;

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.phantom?.solana || window.solana!;

            if (!wallet.isConnected) {
                try {
                    await wallet.connect();
                } catch (error: any) {
                    return;
                }
            }

            if (!wallet.publicKey) return;

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(wallet.publicKey.toBytes());
            } catch (error: any) {
                return;
            }

            wallet.on('disconnect', this._disconnected);
            wallet.on('accountChanged', this._accountChanged);

            this._wallet = wallet;
            this._publicKey = publicKey;

        } catch (error: any) {
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
            }
        }
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
        console.log("Options", options);
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

                const { signature } = await wallet.signAndSendTransaction(transaction, sendOptions);
                return signature;
            } catch (error: any) {
                throw error;
            }
        } catch (error: any) {
            throw error;
        }
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new Error();

            try {
                return (await wallet.signTransaction(transaction)) || transaction;
            } catch (error: any) {
                throw new Error(error?.message, error);
            }
        } catch (error: any) {
            throw error;
        }
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new Error();

            try {
                return (await wallet.signAllTransactions(transactions)) || transactions;
            } catch (error: any) {
                throw new Error(error?.message, error);
            }
        } catch (error: any) {
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new Error();

            try {
                const { signature } = await wallet.signMessage(message);
                return signature;
            } catch (error: any) {
                throw new Error(error?.message, error);
            }
        } catch (error: any) {
            throw error;
        }
    }

    private _disconnected = () => {
        const wallet = this._wallet;
        if (wallet) {
            this._wallet = null;
            this._publicKey = null;
        }
    };

    private _accountChanged = (newPublicKey: PublicKey) => {
        console.log("Account Changed", this._publicKey, newPublicKey);
        const publicKey = this._publicKey;
        if (!publicKey) return;

        try {
            newPublicKey = new PublicKey(newPublicKey.toBytes());
        } catch (error: any) {
            return;
        }

        if (publicKey.equals(newPublicKey)) return;

        this._publicKey = newPublicKey;
        this._callbacks['publicKeyChanged'] && this._callbacks['publicKeyChanged'](newPublicKey);
    };

    public on(event: string, callback: any) {
        this._callbacks[event] = callback;
    }
}
