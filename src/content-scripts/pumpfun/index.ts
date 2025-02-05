import { initializeButtonEvent } from "../main/modal";

initializeButtonEvent((event: any) => {
  if (!event) return false;
  if (event.target.tagName == 'BUTTON' && event.target.innerText.trim() == 'place trade') {
    return true;
  }
  return false;
});