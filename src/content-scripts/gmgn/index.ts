import { handleBuySellButton, initializeButtonEvent } from "../main/check";

initializeButtonEvent((element: any) => {
  if (!element || !element.tagName) return null;
  if (element.tagName == 'BUTTON' && 
    element.classList.contains('chakra-button') && 
      (element.innerText.trim() == 'Confirm' || element.innerText.trim() == 'Buy' || element.innerText.trim() == 'Sell')) {
    return element;
  }
  return null;
});