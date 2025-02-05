import { initialize } from 'esbuild';
import './index.css';

let isTokenDisabled = false;
let isTokenChecking = false;
let blockExpiry = 0;
const RISK_SCORE = 5000;

// Event delegation for dynamically added buttons

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

  const pairName = location.pathname.substring(location.pathname.lastIndexOf('/') + 1).split('?')[0];
  let tokenName  = '';

  try {
    const getPairUrl = `https://api.dexscreener.com/latest/dex/pairs/solana/${pairName}`;
    let response = await fetch(getPairUrl);
    let data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
        const baseToken = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        tokenName = baseToken;
    }else {
      const getTokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${pairName}`;
      response = await fetch(getTokenUrl);
      data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const baseToken = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        tokenName = baseToken;
      }
    }

    console.log("Token Name", tokenName);
    if (!tokenName) {
      isTokenChecking = false;
      isTokenDisabled = false;
      return;
    }

    const rugCheckUrl = `https://api.rugcheck.xyz/v1/tokens/${tokenName}/report/summary`;
    response = await fetch(rugCheckUrl);
    data = await response.json();

    console.log("Rug Check Result", data);
    
    if (data.score && Number(data.score) >= RISK_SCORE) {
      isTokenDisabled = true;
    }
  } catch (error) {
      console.error("Error fetching data:", error);
      isTokenDisabled = false;
  }

  isTokenChecking = false;
}

checkToken();

let lastPathname = window.location.pathname;

const observer = new MutationObserver(() => {
  if (lastPathname === window.location.pathname) return;
  lastPathname = window.location.pathname;
  console.log("Pathname changed:", window.location.pathname);
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

export const initializeButtonEvent = (callback: any): void => {
    document.body.addEventListener('click', (event: MouseEvent) => {
        if (!isTokenDisabled) return;

        if (callback(event)) {
            handleBuySellButton(event);
        }
    });
};