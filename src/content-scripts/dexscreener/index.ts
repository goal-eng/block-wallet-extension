import { initializeButtonEvent } from "../main/modal";

initializeButtonEvent((event: any) => {
  if (!event) return false;
  if (event.target.classList.contains('custom-1huerfx') || 
    event.target.classList.contains('custom-1kwmd0q') || 
    event.target.closest('.custom-1huerfx,.custom-1kwmd0q')) {
    return true;
  }
  return false;
});