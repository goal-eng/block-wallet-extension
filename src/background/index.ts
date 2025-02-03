import { config } from '@common/config';
import { checkTabs } from '../utils';

const updateWalletAddress = (response: any) => {
  console.log("Update Wallet Address", response);
  const address = response?.address || '';
  chrome.storage.local.get("walletAddress", (data) => {
    console.log("Get Wallet Address", data, address);
    if (address !== data.walletAddress) {
      chrome.storage.local.set({ walletAddress: address });
    }
  });
}

const requestWalletAddress = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
    if (!checkTabs(tabs)) return;
    console.log("Request Wallet Address", tabs);
    chrome.tabs.sendMessage(tabs[0].id, { type: "SEND_TO_PAGE_CONTENT", message: "REQUEST_WALLET_ADDRESS" }).catch((error) => {});
  });
}

chrome.storage.local.onChanged.addListener((changes) => {
  console.log('Storage changed', changes);
})

chrome.tabs.onActivated.addListener(() => {
  requestWalletAddress();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background Message", message);
  if (message.type === "SEND_TO_PAGE_BACKGROUND") {
    // Forward the message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if (checkTabs(tabs)) {
        console.log("Send to Page Content", tabs[0].id, message.message, message.data);
        chrome.tabs.sendMessage(tabs[0].id, { type: "SEND_TO_PAGE_CONTENT", message: message.message, data: message.data }).catch((error) => {});
      }
    });
    sendResponse({ success: true });
  }else if (message.type === "UPDATE_WALLET_ADDRESS") {
    updateWalletAddress(message);
    sendResponse({ success: true });
  }
  return true;
});