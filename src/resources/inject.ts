import { Connection, clusterApiUrl, PublicKey, Transaction } from "@solana/web3.js";

import { BlockWallet } from "@src/common/solana/idl/block_wallet";
import BlockWalletIDL from "@src/common/solana/idl/block_wallet.json";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Buffer } from 'buffer';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { _FEE_ACCOUNT, _SOLANA_CONNECTION, Wallet } from '@src/common/solana/wallet/utils';

let firstLoaded = false;
// console.log("RugShield Injected");

if (!firstLoaded) {
    firstLoaded = true;
    // console.log("Block Wallet Injected", topWindow.rugshield);
    if (!window.rugshield) window.rugshield = {};
    // topWindow.rugshield.injected = true;
    const rugshield = window.rugshield;
    
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

    rugshield.signTransactions = async (serializedTxs: string[]) => {
        try {
            if (!rugshield.getWallet().connected) return null;
            let serializedSignedTxs = [];
            for (const serializedTx of serializedTxs) {
                // Convert the base64 string back to a Transaction object
                const txBuffer = Buffer.from(serializedTx, 'base64');
                const tx = Transaction.from(txBuffer);
                
                // Retrieve your wallet (assumes getWallet() returns an object with a signTransaction method)
                const wallet = rugshield.getWallet() as Wallet;
                
                // Sign the transaction using your wallet
                const signedTx = await wallet.signTransaction(tx);
                serializedSignedTxs.push(signedTx.serialize().toString('base64'));
            }
            return serializedSignedTxs;
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    rugshield.updateWalletAddress = () => {
        window.postMessage({ type: "UPDATE_WALLET_ADDRESS", address: rugshield.getWallet().publicKey?.toBase58() }, "*");
    }

    rugshield.handleMessageCallback = async (event: MessageEvent<any>) => {
        if (event.data.type === "FROM_RUGSHIELD") {
            // console.log("Message", event.data);
            if (event.data.data.wallet) { 
                rugshield.config.wallet = event.data.data.wallet;
            }
            if (rugshield.getWallet()) {
                switch (event.data.message) {
                case 'REQUEST_WALLET_ADDRESS':
                    rugshield.updateWalletAddress();    
                    break;
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
                        } catch(e) {
                            console.error(e);
                        }
                        rugshield.updateWalletAddress();
                    }
                    break;
                case 'SIGN_TRANSACTIONS':
                    const result = await rugshield.signTransactions(event.data.data.txs);
                    if (result) {
                        window.postMessage({ type: "SEND_TRANSACTIONS", data: {
                            type: event.data.data.type,
                            txs: result
                        } }, "*");
                    }else {
                        window.postMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: event.data.data.type }, "*");
                    }
                    break; 
                case 'SEND_TRANSACTIONS':
                    window.postMessage({ type: "UPDATE_WALLET_STATE", code: event.data.data.success ? 0 : 1, data: event.data.data.type }, "*");
                    break;  
                }
            }
        }
    }

    window.addEventListener("message", rugshield.handleMessageCallback);
    const initialize = async () => {
        try {
            // await wallet.connect();
            rugshield.updateWalletAddress();
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                window.trustedTypes.createPolicy('default', {
                    createHTML: (string, sink) => string
                });
            }
        } catch {
        }
    };
    
    initialize();
}
