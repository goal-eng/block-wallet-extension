import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

import { BlockWallet } from "./idl/block_wallet";
import BlockWalletIDL from "./idl/block_wallet.json";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Buffer } from 'buffer';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { SolflareWalletAdapter } from './wallet/solflare';
import { Wallet } from './wallet/utils';

let _CONFIG = {
    wallet: 'phantom'   // 'solflare'
};

// let wallet = new PhantomWalletAdapter();
let _WALLETS: {
    [key: string]: Wallet
} = {
    'phantom': new PhantomWalletAdapter(),
    'solflare': new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet })
};

const getWallet = (): Wallet => {
    return _WALLETS[_CONFIG.wallet || 'phantom'];
}

const _SOLANA_CONNECTION = new Connection(clusterApiUrl("devnet"));
const _FEE_ACCOUNT = new PublicKey("FwLFdJeGwx7UUAQReU4tx94KA4KZjyp4eX8kdWf4yyG8");

const getProgram = (provider: AnchorProvider) => {
    return new Program<BlockWallet>(BlockWalletIDL as any, provider);
}

const blockWallet = async (blockInterval: number) => {
    // console.log("Blocking Wallet....", blockInterval);
    try {
        if (!blockInterval || !getWallet().connected) {
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'BLOCK' }, "*");
            return;
        }
        const provider = new AnchorProvider(_SOLANA_CONNECTION, getWallet() as any, AnchorProvider.defaultOptions());
        const program = getProgram(provider);
        const [walletPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
            program.programId
        );

        const accountInfo = await _SOLANA_CONNECTION.getAccountInfo(walletPDA);
        // console.log("Account Info", accountInfo);
        if (!accountInfo) {
            const tx = await program.methods.initialize(_FEE_ACCOUNT)
            .accounts({
                user: provider.wallet.publicKey,
            })
            .rpc();
            await _SOLANA_CONNECTION.confirmTransaction(tx, 'finalized');
        }
        // If account exists, just send block instruction
        const tx = await program.methods.blockWallet(new BN(blockInterval * 60 * 60))
        .accounts({
            user: provider.wallet.publicKey,
            feeAccount: _FEE_ACCOUNT,
        })
        .rpc();
        await _SOLANA_CONNECTION.confirmTransaction(tx, 'finalized');

        window.postMessage({ type: "UPDATE_WALLET_STATE", code: 0, data: 'BLOCK' }, "*");
    } catch(e) {
        // console.log("Block Wallet Error:", e);
        window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'BLOCK' }, "*");
    }
}

const unblockWallet = async () => {
    // console.log("Unblocking Wallet....");
    try {
        if (!getWallet().connected) {
            window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'UNBLOCK' }, "*");
            return;
        }
        const provider = new AnchorProvider(_SOLANA_CONNECTION, getWallet() as any, AnchorProvider.defaultOptions());
        const program = getProgram(provider);
        const [walletPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
            program.programId
        );

        const accountInfo = await _SOLANA_CONNECTION.getAccountInfo(walletPDA);
        // console.log("Account Info", accountInfo);
        if (!accountInfo) {
            const tx = await program.methods.initialize(_FEE_ACCOUNT)
            .accounts({
                user: provider.wallet.publicKey,
            })
            .rpc();
            await _SOLANA_CONNECTION.confirmTransaction(tx, 'finalized');
        }
        const tx = await program.methods.unblockWallet()
            .accounts({
                user: provider.wallet.publicKey,
                feeAccount: _FEE_ACCOUNT,
            })
            .rpc();
        await _SOLANA_CONNECTION.confirmTransaction(tx, 'finalized');

        window.postMessage({ type: "UPDATE_WALLET_STATE", code: 0, data: 'UNBLOCK' }, "*");
    } catch(e) {
        // console.log("Unblock Wallet Error:", e);
        window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'UNBLOCK' }, "*");
    }
}

const updateWalletAddress = async () => {
    // console.log("UPDATE_WALLET_ADDRESS", getWallet().publicKey?.toBase58());
    if (!getWallet().connected) {
        window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: '', expiry: 0 }, "*");
        return;
    }
    try {
        const provider = new AnchorProvider(_SOLANA_CONNECTION, getWallet() as any, AnchorProvider.defaultOptions());
        const program = getProgram(provider);
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
        const balance = await _SOLANA_CONNECTION.getBalance(provider.wallet.publicKey);
        window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: getWallet().publicKey?.toBase58(), expiry: expiry, balance: balance }, "*");
    } catch (e) {
        window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: getWallet().publicKey?.toBase58(), expiry: 0 }, "*");
    }
}

if (getWallet().readyState == WalletReadyState.Installed) {
    // Listen for wallet address change
    // wallet.on("accountChanged", (newPublicKey: string) => {
    //     console.log("Public Key Changed!!!!", newPublicKey);

    //     updateWalletAddress();
    // });
}

window.addEventListener("message", async (event) => {
    if (event.data.type === "FROM_BLOCK_WALLET") {
        if (event.data.data.wallet) {
            _CONFIG.wallet = event.data.data.wallet;
        }
        if (getWallet()) {
            switch (event.data.message) {
            case 'DISCONNECT_WALLET':
                await getWallet().disconnect();
                updateWalletAddress();
                break;
            case 'CONNECT_WALLET':
                if (getWallet().connected) {
                    // Send wallet address to background script
                    updateWalletAddress();
                }else {
                    try {
                        await getWallet().connect();
                    } catch {
                    }
                    updateWalletAddress();
                }
                break;
            case 'REQUEST_WALLET_ADDRESS':
                updateWalletAddress();
                break;
            case 'BLOCK_WALLET':
                blockWallet(event.data.data || 0);
                break;
            case 'UNBLOCK_WALLET':
                unblockWallet();
                break;
            }
        }
    }
});

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