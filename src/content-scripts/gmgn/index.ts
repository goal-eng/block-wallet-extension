import { handleBuySellButton, initializeButtonEvent } from "../main/modal";

initializeButtonEvent((event: any) => {
  if (!event) return false;
  if (event.target.tagName == 'BUTTON' && 
      event.target.classList.contains('chakra-button') && 
      (event.target.innerText.trim() == 'Confirm' || event.target.innerText.trim() == 'Buy' || event.target.innerText.trim() == 'Sell')) {
    return true;
  }
  return false;
});