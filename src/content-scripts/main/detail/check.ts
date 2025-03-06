import { initialize } from 'esbuild';
import { hideModal, rebuildModal, showModal, showModalDetails } from './modal';

let isTokenDisabled = false;
let isTokenChecking = false;
let blockExpiry = 0;
const RISK_SCORE = 5000;

// Event delegation for dynamically added buttons
setInterval(() => {
  showModalDetails(Number(blockExpiry || 0) > new Date().getTime());
}, 1000);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  
  switch (event.data.type) {
      case "UPDATE_WALLET_ADDRESS":
          // Send the Phantom Wallet address to the background script
          event.data.expiry && (blockExpiry = event.data.expiry);
          break;
      default:
          break;
  }
});

async function checkToken() {
  if (isTokenChecking) return;
  isTokenChecking = true;

  const pairAddress = location.pathname.substring(location.pathname.lastIndexOf('/') + 1).split('?')[0];
  let tokenAddress  = '';
  let tokenName = '', tokenSymbol = '';

  try {
    const getPairUrl = `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`;
    let response = await fetch(getPairUrl);
    let data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
        const baseToken = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        tokenAddress = baseToken;
        tokenSymbol = data.pairs[0].baseToken.symbol;
        tokenName = data.pairs[0].baseToken.name;
    }else {
      const getTokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${pairAddress}`;
      response = await fetch(getTokenUrl);
      data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const baseToken = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        tokenAddress = baseToken;
        tokenSymbol = data.pairs[0].baseToken.symbol;
        tokenName = data.pairs[0].baseToken.name;
      }
    }

    // console.log("Token Name", tokenAddress);
    if (!tokenAddress) {
      isTokenChecking = false;
      isTokenDisabled = false;
      rebuildModal();
      return;
    }

    chrome.runtime.sendMessage(
      { type: "FETCH_DATA", url: `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary` },
      (response) => {
        if (response.success) {
          const data = response.data;
          rebuildModal({
            name: tokenName,  
            symbol: tokenSymbol,
            score: Number(data.score || 0),
            risks: data.risks || [],
          });
      
          if (data.score && Number(data.score) >= RISK_SCORE) {
            isTokenDisabled = true;
          }

          console.log("Fetched Data:", response.data);
        } else {
          console.error("Error:", response.error);
        }
      }
    );

    // const rugCheckUrl = `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`;
    // response = await fetch(rugCheckUrl);
    // data = await response.json();

    // console.log("Rug Check Result", data);
    
    
  } catch (error) {
    rebuildModal();
    // console.error("Error fetching data:", error);
    isTokenDisabled = false;
  }

  isTokenChecking = false;
}

checkToken();

let lastPathname = window.location.pathname;

const observer = new MutationObserver(() => {
  if (lastPathname === window.location.pathname) return;
  lastPathname = window.location.pathname;
  // console.log("Pathname changed:", window.location.pathname);
  checkToken();
});

observer.observe(document.body, { childList: true, subtree: true });

export function handleBuySellButton(event: Event) {
  if (Number(blockExpiry || 0) > new Date().getTime()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alert("This token is danger. Please do not buy or sell this token.");
  }
}

let mouseEnteredCount = 0;

export const initializeButtonEvent = (getButton: any): void => {
  document.addEventListener('click', (event: MouseEvent) => {
    if (!isTokenDisabled) return;

    if (getButton(event.target)) {
      mouseEnteredCount = 0;
      hideModal();
      handleBuySellButton(event);
    }
  }, true);

  document.addEventListener('mouseenter', (event: MouseEvent) => {
    const button = getButton(event.target);
    if (button) {
      mouseEnteredCount++;
      showModal(button);
    }
  }, true);

  document.addEventListener('mouseleave', (event: MouseEvent) => {
    const button = getButton(event.target);
    if (button) {
      mouseEnteredCount > 0 && mouseEnteredCount--;
      !mouseEnteredCount && hideModal();
    }
  }, true);
  window.addEventListener('scroll', (event: Event) => {
    mouseEnteredCount = 0;
    hideModal();
  });
};