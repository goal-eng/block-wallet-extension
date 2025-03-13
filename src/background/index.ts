import { checkTabs } from '../utils';

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

let lastTimestamp = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Background Message", message);
  if (message.type == "CHECK_CONTENT_EXECUTION") {
    sendResponse({ alreadyExecuted: lastTimestamp == 0 });
    lastTimestamp = 0;
  }
  else if (message.type === "SEND_TO_PAGE_BACKGROUND") {
    (async () => {
      if (message.message == 'REQUEST_WALLET_TYPE') {
        const wallet = await getWalletType();
        sendResponse({ success: true, wallet });
      }else if (message.message == 'UPDATE_WALLET_TYPE') {
        await updateWalletType(message);
        sendResponse({ success: true });
      }else {
        // Forward the message to the active tab
        chrome.tabs.query({ active: true }, async (tabs: any) => {
          if (checkTabs(tabs)) {
            // console.log("Send to Page Content", tabs[0].id, message.message, message.data);
            lastTimestamp = Date.now();
            chrome.tabs.sendMessage(tabs[0].id, { type: "SEND_TO_PAGE_CONTENT", message: message.message, data: await addWalletTypeToData(message.data), timestamp: lastTimestamp }).catch((error) => {});
          }
        });
        sendResponse({ success: true });
      }
    })();
  }
  return true;
});