import { initializeButtonEvent } from "../main/modal";

initializeButtonEvent((event: any) => {
  if (!event) return false;
  if (event.target.classList.contains('js-buy-btn') || 
    event.target.classList.contains('js-sell-btn') || 
    event.target.closest('.js-buy-btn,.js-sell-btn')) {
    return true;
  }
  return false;
});