import { config } from '@common/config';
import { checkTabs } from '../utils';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { Wallet } from '@src/resources/wallet/utils';

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

const requestWalletAddress = async() => {
  chrome.tabs.query({ active: true }, async (tabs: any) => {
    if (!checkTabs(tabs)) return;
    // console.log("Request Wallet Address", tabs);
    chrome.tabs.sendMessage(tabs[0].id, { type: "SEND_TO_PAGE_CONTENT", message: "REQUEST_WALLET_ADDRESS", data: await addWalletTypeToData() }).catch((error) => {});
  });
}

chrome.storage.local.onChanged.addListener((changes) => {
  // console.log('Storage changed', changes);
})

chrome.tabs.onCreated.addListener((tab) => {

  if (tab.url === "chrome-newtab://") {

      chrome.tabs.update({ url: "https://www.google.com" });

  }

});

chrome.tabs.onActivated.addListener(() => {
  requestWalletAddress();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Background Message", message);
  if (message.type === "SEND_TO_PAGE_BACKGROUND") {
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
            console.log("Send to Page Content", tabs[0].id, message.message, message.data);
            chrome.tabs.sendMessage(tabs[0].id, { type: "SEND_TO_PAGE_CONTENT", message: message.message, data: await addWalletTypeToData(message.data) }).catch((error) => {});
          }
        });
        sendResponse({ success: true });
      }
    })();
  }else if (message.type === "UPDATE_WALLET_ADDRESS") {
    updateWalletAddress(message);
    sendResponse({ success: true });
  }
  else if (message.type == "FETCH_DATA") {
    // console.log(message);
    fetch(message.url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.text())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Required for asynchronous `sendResponse`
  }
  return true;
});

// chrome.declarativeNetRequest.updateDynamicRules({
//   addRules: [
//     {
//       id: 1,
//       priority: 1,
//       action: {
//         type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
//         responseHeaders: [
//           { header: "access-control-allow-origin", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "*" }
//         ]
//       },
//       condition: {
//         urlFilter: "*://example.com/*",
//         resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST]
//       }
//     }
//   ],
//   removeRuleIds: [1]
// });