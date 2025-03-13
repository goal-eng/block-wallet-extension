import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

import { BlockWallet } from "@src/common/solana/idl/block_wallet";
import BlockWalletIDL from "@src/common/solana/idl/block_wallet.json";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Buffer } from 'buffer';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { _FEE_ACCOUNT, _SOLANA_CONNECTION, Wallet } from '@src/common/solana/wallet/utils';

let firstLoaded = false;

if (!firstLoaded) {
    firstLoaded = true;

    const getWalletAddress = async () => {
        const local = await chrome.storage.local.get("walletAddress");
        return local.walletAddress || '';
    }

    const syncWalletAddress = async () => {
        const walletAddress = await getWalletAddress();
        // console.log("UPDATE_WALLET_ADDRESS", walletAddress);
        if (!walletAddress) {
            chrome.runtime.sendMessage({ type: "UPDATE_WALLET_ADDRESS", address: '', expiry: 0 });
            return;
        }
        try {
            const provider = new AnchorProvider(_SOLANA_CONNECTION, {
                publicKey: new PublicKey(walletAddress)
            } as any, AnchorProvider.defaultOptions());
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
            chrome.runtime.sendMessage({ type: "UPDATE_WALLET_ADDRESS", address: walletAddress, expiry: expiry, balance: balance });
            setBlockExpiry(expiry);
        } catch (e) {
            // console.log("ERROR", e);
            chrome.runtime.sendMessage({ type: "UPDATE_WALLET_ADDRESS", address: walletAddress, expiry: 0 });
            setBlockExpiry(0);
        }
    }

    const setWalletAddress = async (address: string) => {
        // console.log("Set Wallet Address", address);
        chrome.storage.local.set({ walletAddress: address || '' }).then(() => {
            syncWalletAddress();
        });
    }

    const setBlockExpiry = async (expiry: number) => {
        // chrome.storage.local.set({ blockExpiry: expiry || 0 });
        window.blockExpiry = expiry;
    }

    // Inject a script into the webpage
    const script = document.createElement("script");
    script.setAttribute("async","false");
    script.src = chrome.runtime.getURL("resources/inject.js"); // Load from extension files
    script.type = "module"; // Use module to avoid conflicts
    const e = (document.head || document.documentElement);
    e.insertBefore(script, e.children[0]);
    e.removeChild(script);
    
    const getProgram = (provider: AnchorProvider) => {
        return new Program<BlockWallet>(BlockWalletIDL as any, provider);
    }
    
    const getBlockTransactions = async (blockInterval: number): Promise<string[]> => {
        // console.log("Blocking Wallet....", blockInterval);
        const walletAddress = await getWalletAddress();
        let serializedTxs: string[] = [];
        try {
            if (!blockInterval || !walletAddress) {
                chrome.runtime.sendMessage({ type: "UPDATE_WALLET_STATE", code: 1, data: 'BLOCK' });
                return [];
            }
            const provider = new AnchorProvider(_SOLANA_CONNECTION, {
                publicKey: new PublicKey(walletAddress)
            } as any, AnchorProvider.defaultOptions());
            const program = getProgram(provider);
            const [walletPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("wallet"), provider.wallet.publicKey.toBuffer()],
                program.programId
            );
    
            const accountInfo = await _SOLANA_CONNECTION.getAccountInfo(walletPDA);
            // console.log("Account Info", accountInfo);
            
            if (!accountInfo) {
                // Fetch and assign a recent blockhash
                const tx = await program.methods.initialize(_FEE_ACCOUNT)
                .accounts({
                    user: provider.wallet.publicKey,
                })
                .transaction();
                const { blockhash } = await _SOLANA_CONNECTION.getRecentBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = new PublicKey(walletAddress);
                serializedTxs.push(tx.serialize({ requireAllSignatures: false }).toString('base64'));
            }
            // If account exists, just send block instruction
            const tx = await program.methods.blockWallet(new BN(blockInterval * 60 * 60))
            .accounts({
                user: provider.wallet.publicKey,
                feeAccount: _FEE_ACCOUNT,
            })
            .transaction();
            const { blockhash } = await _SOLANA_CONNECTION.getRecentBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = new PublicKey(walletAddress);
            serializedTxs.push(tx.serialize({ requireAllSignatures: false }).toString('base64'));
        } catch(e) {
            // console.log("Block Wallet Error:", e);
        }
        return serializedTxs;
    }
    
    const getUnblockTransactions = async (): Promise<string[]> => {
        // console.log("Unblocking Wallet....");
        const walletAddress = await getWalletAddress();
        let serializedTxs = [];
        try {
            if (!walletAddress) {
                return [];
            }
            const provider = new AnchorProvider(_SOLANA_CONNECTION, {
                publicKey: new PublicKey(walletAddress)
            } as any, AnchorProvider.defaultOptions());
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
                .transaction();
                const { blockhash } = await _SOLANA_CONNECTION.getRecentBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = new PublicKey(walletAddress);
                serializedTxs.push(tx.serialize({ requireAllSignatures: false }).toString('base64'));
            }
            const tx = await program.methods.unblockWallet()
            .accounts({
                user: provider.wallet.publicKey,
                feeAccount: _FEE_ACCOUNT,
            })
            .transaction();
            const { blockhash } = await _SOLANA_CONNECTION.getRecentBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = new PublicKey(walletAddress);
            serializedTxs.push(tx.serialize({ requireAllSignatures: false }).toString('base64'));
        } catch(e) {
            // console.log("Unblock Wallet Error:", e);
        }
        return serializedTxs;
    }

    const handleMessageCallback = async (message: any) => {
        // console.log("Message", message);
        switch (message.message) {
        case 'DISCONNECT_WALLET':
        case 'CONNECT_WALLET':
        case 'REQUEST_WALLET_ADDRESS':
            window.postMessage({ type: "FROM_RUGSHIELD", message: message.message, data: message.data }, "*");
            break;
        case 'BLOCK_WALLET': {
            const txs = await getBlockTransactions(message.data.interval || 0);
            window.postMessage({ type: "FROM_RUGSHIELD", message: "SIGN_TRANSACTIONS", data: {
                txs: txs,
                type: 'BLOCK'
            } }, "*");
            break;
        }
        case 'UNBLOCK_WALLET': {
            const txs = await getUnblockTransactions();
            window.postMessage({ type: "FROM_RUGSHIELD", message: "SIGN_TRANSACTIONS", data: {
                txs: txs,
                type: 'UNBLOCK'
            } }, "*");
            break;
        }
        }
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        chrome.runtime.sendMessage({ type: "CHECK_CONTENT_EXECUTION" }, (response) => {
            if (response && response.alreadyExecuted) {
                return;
            }
            // console.log("Content Scripts Message", message);
            // Your main script logic here
            if (message.type === "SEND_TO_PAGE_CONTENT") {
                try {
                    handleMessageCallback(message);
                } catch (e) {
                    console.error(e);
                }
            }
            sendResponse({ success: true });
        });
        return true;
    });
    
    // syncWalletAddress();
    
    window.addEventListener("message", async (event) => {
        if (event.source !== window) return;
        
        try {
            switch (event.data.type) {
                case "UPDATE_WALLET_ADDRESS":
                    setWalletAddress(event.data.address);
                    break;
                case "UPDATE_WALLET_STATE":
                    chrome.runtime.sendMessage(event.data);
                    break;
                case "SEND_TRANSACTIONS": {
                    // console.log("Message from Inject", event.data);
                    let txids = [];
                    try {
                        const serializedSignedTxs = event.data.data.txs;
                        for (const serializedSignedTx of serializedSignedTxs) {
                            const txBuffer = Buffer.from(serializedSignedTx, 'base64');
                            // Send the signed transaction to the network
                            const txid = await _SOLANA_CONNECTION.sendRawTransaction(txBuffer);
                            
                            // Confirm the transaction finalization on-chain
                            await _SOLANA_CONNECTION.confirmTransaction(txid, 'finalized');
                            txids.push(txid);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    window.postMessage({ type: "FROM_RUGSHIELD", message: "SEND_TRANSACTIONS", data: {
                        type: event.data.data.type,
                        success: txids.length > 0
                    } }, "*");
                    break;
                }

            }
        } catch {
        }
    });
}
