import { initializeButtonEvent } from "../main/check";

initializeButtonEvent((element: any) => {
  if (!element || !element.tagName) return null;
  if (element.tagName == 'BUTTON' && element.innerText.trim() == 'place trade') {
    return element;
  }
  return null;
});