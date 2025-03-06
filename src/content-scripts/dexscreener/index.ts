import { initializeButtonEvent } from "../main/detail/check";
import { addButtonEventListener } from '../main/list/modal';

initializeButtonEvent((element: any) => {
  if (!element || !element.classList) return null;
  if (element.classList.contains('custom-1huerfx') || 
    element.classList.contains('custom-1kwmd0q')) {
      return element;
  }
  return element.closest('.custom-1huerfx,.custom-1kwmd0q');
});

// Target a parent container where new divs are being generated
const targetNode = document.body; // Adjust this selector based on your use case

// Configuration for the observer (observe child additions)
const config_observe = { childList: true, subtree: true };

// Callback to execute when mutations are observed
const callback = (mutationsList: any) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      // Loop through added nodes
      mutation.addedNodes.forEach((node: any) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
          // Check if the added node is the desired div
          if (node.classList.contains('ds-table-data-cell') && node.classList.contains('ds-dex-table-row-col-token')) {
            // Create a button and append to the new div
            addButton(node);
          }else {
            const targetDivs = document.querySelectorAll(".ds-table-data-cell.ds-dex-table-row-col-token");
            targetDivs.forEach((targetDiv: any) => {
              addButton(targetDiv);
            });
          }
        }
      });
    }
  }
};

// Create an observer instance
const observer = new MutationObserver(callback);

// Start observing the target node
observer.observe(targetNode, config_observe);

const addButton = (div: any) => {
  if (!div || !div.querySelector) return;
  const analyzeBtn = div.querySelector('._ex_btn_analyze');
  if(analyzeBtn) return;
  // Create a button element
  const button = document.createElement("button");
  button.innerHTML = "R";
  button.className = "_ex_btn_analyze circle";
  button.style.marginLeft = '5px';
  addButtonEventListener(button, div.closest('a'));

  // Append the button to the child div
  div.append(button);
}

const initialize = () => {
  // Find the target div
  const targetDivs = document.querySelectorAll(".ds-dex-table > .ds-dex-table-row"); // Replace with your selector
  if (!targetDivs.length) {
    setTimeout(initialize, 1000);
    return;
  }
  setTimeout(() => {
    targetDivs.forEach((targetDiv: any) => {
      // Find all child divs within the target div
      const childDiv = targetDiv.querySelector("div.ds-table-data-cell.ds-dex-table-row-col-token");
      addButton(childDiv);
    });
  }, 1000);
}

setTimeout(initialize, 1000);