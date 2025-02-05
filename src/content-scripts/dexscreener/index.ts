import { initializeButtonEvent } from "../main/check";

initializeButtonEvent((element: any) => {
  if (!element || !element.classList) return null;
  if (element.classList.contains('custom-1huerfx') || 
    element.classList.contains('custom-1kwmd0q')) {
      return element;
  }
  return element.closest('.custom-1huerfx,.custom-1kwmd0q');
});