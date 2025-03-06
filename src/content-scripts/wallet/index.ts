import { config } from '@common/config';

function getTopWindow() {
    let currentWindow: Window = window;
    while (currentWindow.parent !== currentWindow) {
        currentWindow = currentWindow.parent;
    }
    return currentWindow;
}

const topWindow = getTopWindow();

if (topWindow == window.self) {

    // Inject a script into the webpage
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("resources/inject.js"); // Load from extension files
    script.type = "module"; // Use module to avoid conflicts
    document.documentElement.appendChild(script);
    script.remove(); // Clean up after execution
    
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