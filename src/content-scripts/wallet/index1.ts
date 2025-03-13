import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

let firstLoaded = false;

try {
    if (!firstLoaded) {
        firstLoaded = true;

        const updateWalletAddress = (response: any) => {
          // console.log("Update Wallet Address", response);
          const address = response?.address || '';
          chrome.storage.local.get("walletAddress", (data) => {
            // console.log("Get Wallet Address", data, address);
            if (address !== data.walletAddress) {
              chrome.storage.local.set({ walletAddress: address });
            }
          });
        }
        
        const getWalletType = async () => {
          const local = await chrome.storage.local.get("walletType");
          return local.walletType;
        }
        
        const addWalletTypeToData = async (data: any = {}) => {
          if (!data) data = {};
          if (!data.wallet) data.wallet = await getWalletType();
          return data;
        }
        
        const updateWalletType = async (response: any) => {
          // console.log("Update Wallet Type", response);
          const wallet = response?.wallet || '';
          const walletType = await getWalletType();
          if (walletType != wallet) {
            await chrome.storage.local.set({ walletType: wallet });
          }
        }

        // Inject a script into the webpage
        const script = document.createElement("script");
        script.setAttribute("async","false");
        script.src = chrome.runtime.getURL("resources/inject.js"); // Load from extension files
        script.type = "module"; // Use module to avoid conflicts
        const e = (document.head || document.documentElement);
        e.insertBefore(script, e.children[0]);
        e.removeChild(script);
        
        
    
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // console.log("Content Scripts Message", message);
        
            if (message.type === "SEND_TO_PAGE_CONTENT") {
                window.postMessage({ type: "FROM_RUGSHIELD", message: message.message, data: message.data }, "*");
            }
            sendResponse({ success: true });
            return true;
        });
        
        window.postMessage({ type: "FROM_RUGSHIELD", message: "REQUEST_WALLET_ADDRESS" }, "*");
        
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            
            try {
                switch (event.data.type) {
                    case "GET_BALANCE":
                        break;
                    case "UPDATE_WALLET_ADDRESS":
                    case "UPDATE_WALLET_STATE":
                        // Send the Phantom Wallet address to the background script
                        chrome.runtime.sendMessage(event.data);
                        break;
                    default:
                        break;
                }
            } catch {
            }
        });
    }
} catch {
}