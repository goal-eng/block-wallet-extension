import { initializeButtonEvent } from "../main/detail/check";

initializeButtonEvent((element: any) => {
  if (!element || !element.classList) return null;
  if (element.classList.contains('js-buy-btn') || 
    element.classList.contains('js-sell-btn')) {
    return element;
  }
  return element.closest('.js-buy-btn,.js-sell-btn');
});