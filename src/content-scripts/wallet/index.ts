import { config } from '@common/config';

let firstLoaded = false;

if (!firstLoaded) {
    firstLoaded = true;
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
            window.postMessage({ type: "FROM_BLOCK_WALLET", message: message.message, data: message.data }, "*");
        }
        sendResponse({ success: true });
        return true;
    });
    
    window.postMessage({ type: "FROM_BLOCK_WALLET", message: "REQUEST_WALLET_ADDRESS" }, "*");
    
    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        
        try {
            switch (event.data.type) {
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