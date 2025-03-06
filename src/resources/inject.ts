import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

import { BlockWallet } from "./idl/block_wallet";
import BlockWalletIDL from "./idl/block_wallet.json";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Buffer } from 'buffer';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { Wallet } from './wallet/utils';

function getTopWindow() {
    let currentWindow: Window = window;
    while (currentWindow.parent !== currentWindow) {
        currentWindow = currentWindow.parent;
    }
    return currentWindow;
}

const topWindow = getTopWindow();

if (topWindow == window.self) {
    // console.log("Block Wallet Injected", topWindow.rugshield);
    if (!topWindow.rugshield) topWindow.rugshield = {};
    // topWindow.rugshield.injected = true;
    const rugshield = topWindow.rugshield;
    
    rugshield.config = {
        wallet: 'phantom'   // 'solflare'
    };
    
    // let wallet = new PhantomWalletAdapter();
    rugshield.wallets = {
        'phantom': new PhantomWalletAdapter(),
        'solflare': new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet })
    };
    
    rugshield.getWallet = (): Wallet => {
        return rugshield.wallets[rugshield.config.wallet || 'phantom'];
    }
    
    rugshield.connection = new Connection(clusterApiUrl("devnet"));
    rugshield.feeAccount = new PublicKey("FwLFdJeGwx7UUAQReU4tx94KA4KZjyp4eX8kdWf4yyG8");
    
    rugshield.getProgram = (provider: AnchorProvider) => {
        return new Program<BlockWallet>(BlockWalletIDL as any, provider);
    }
    
    rugshield.blockWallet = async (blockInterval: number) => {
        // console.log("Blocking Wallet....", blockInterval);
        try {
            if (!blockInterval || !rugshield.getWallet().connected) {
                window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'BLOCK' }, "*");
                return;
            }
            const provider = new AnchorProvider(rugshield.connection, rugshield.getWallet() as any, AnchorProvider.defaultOptions());
            const program = rugshield.getProgram(provider);
            const [walletPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
                program.programId
            );
    
            const accountInfo = await rugshield.connection.getAccountInfo(walletPDA);
            // console.log("Account Info", accountInfo);
            if (!accountInfo) {
                const tx = await program.methods.initialize(rugshield.feeAccount)
                .accounts({
                    user: provider.wallet.publicKey,
                })
                .rpc();
                await rugshield.connection.confirmTransaction(tx, 'finalized');
            }
            // If account exists, just send block instruction
            const tx = await program.methods.blockWallet(new BN(blockInterval * 60 * 60))
            .accounts({
                user: provider.wallet.publicKey,
                feeAccount: rugshield.feeAccount,
            })
            .rpc();
            await rugshield.connection.confirmTransaction(tx, 'finalized');
    
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 0, data: 'BLOCK' }, "*");
        } catch(e) {
            // console.log("Block Wallet Error:", e);
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'BLOCK' }, "*");
        }
    }
    
    rugshield.unblockWallet = async () => {
        // console.log("Unblocking Wallet....");
        try {
            if (!rugshield.getWallet().connected) {
                window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'UNBLOCK' }, "*");
                return;
            }
            const provider = new AnchorProvider(rugshield.connection, rugshield.getWallet() as any, AnchorProvider.defaultOptions());
            const program = rugshield.getProgram(provider);
            const [walletPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
                program.programId
            );
    
            const accountInfo = await rugshield.connection.getAccountInfo(walletPDA);
            // console.log("Account Info", accountInfo);
            if (!accountInfo) {
                const tx = await program.methods.initialize(rugshield.feeAccount)
                .accounts({
                    user: provider.wallet.publicKey,
                })
                .rpc();
                await rugshield.connection.confirmTransaction(tx, 'finalized');
            }
            const tx = await program.methods.unblockWallet()
                .accounts({
                    user: provider.wallet.publicKey,
                    feeAccount: rugshield.feeAccount,
                })
                .rpc();
            await rugshield.connection.confirmTransaction(tx, 'finalized');
    
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 0, data: 'UNBLOCK' }, "*");
        } catch(e) {
            // console.log("Unblock Wallet Error:", e);
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'UNBLOCK' }, "*");
        }
    }
    
    rugshield.updateWalletAddress = async () => {
        // console.log("UPDATE_WALLET_ADDRESS", getWallet().publicKey?.toBase58());
        if (!rugshield.getWallet().connected) {
            window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: '', expiry: 0 }, "*");
            return;
        }
        try {
            const provider = new AnchorProvider(rugshield.connection, rugshield.getWallet() as any, AnchorProvider.defaultOptions());
            const program = rugshield.getProgram(provider);
            const [walletPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
                program.programId
            );
            let expiry = 0;
            try {
                const walletInfo = await program.account.wallet.fetch(walletPDA);
                expiry = walletInfo.blockExpiry.toNumber() * 1000;
            } catch (e) {
            }
            const balance = await rugshield.connection.getBalance(provider.wallet.publicKey);
            window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: rugshield.getWallet().publicKey?.toBase58(), expiry: expiry, balance: balance }, "*");
        } catch (e) {
            console.log("ERROR", e);
            window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: rugshield.getWallet().publicKey?.toBase58(), expiry: 0 }, "*");
        }
    }

    rugshield.handleMessageCallback = async (event: MessageEvent<any>) => {
        if (event.data.type === "FROM_BLOCK_WALLET") {
            // console.log("Message", event.data);
            if (event.data.data.wallet) {
                rugshield.config.wallet = event.data.data.wallet;
            }
            if (rugshield.getWallet()) {
                switch (event.data.message) {
                case 'DISCONNECT_WALLET':
                    await rugshield.getWallet().disconnect();
                    rugshield.updateWalletAddress();
                    break;
                case 'CONNECT_WALLET':
                    if (rugshield.getWallet().connected) {
                        // Send wallet address to background script
                        rugshield.updateWalletAddress();
                    }else {
                        try {
                            await rugshield.getWallet().connect();
                        } catch {
                        }
                        rugshield.updateWalletAddress();
                    }
                    break;
                case 'REQUEST_WALLET_ADDRESS':
                    rugshield.updateWalletAddress();
                    break;
                case 'BLOCK_WALLET':
                    rugshield.blockWallet(event.data.data.interval || 0);
                    break;
                case 'UNBLOCK_WALLET':
                    rugshield.unblockWallet();
                    break;
                }
            }
        }
    }

    window.addEventListener("message", rugshield.handleMessageCallback);
}

const initialize = async () => {
    try {
        // await wallet.connect();
        // await updateWalletAddress();
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string, sink) => string
            });
        }
    } catch {
    }
};

initialize();