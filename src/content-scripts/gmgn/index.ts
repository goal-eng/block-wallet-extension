import { handleBuySellButton, initializeButtonEvent } from "../main/detail/check";
import { addButtonEventListener } from "../main/list/modal";

initializeButtonEvent((element: any) => {
  if (!element || !element.tagName) return null;
  if (element.tagName == 'BUTTON' && 
    element.classList.contains('chakra-button') && 
      (element.innerText.trim() == 'Confirm' || element.innerText.trim() == 'Buy' || element.innerText.trim() == 'Sell')) {
    return element;
  }
  return null;
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
          if (node.classList.contains('g-table-cell') && node.classList.contains('g-table-cell-fix-left')) {
            // Create a button and append to the new div
            addButton(node);
          }
          else {
            const targetDivs = document.querySelectorAll(".g-table-cell.g-table-cell-fix-left");
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
  console.log("Button Added");
  const analyzeBtn = div.querySelector('._ex_btn_analyze');
  if(analyzeBtn) return;
  // Create a button element
  const button = document.createElement("button");
  button.innerHTML = "R";
  button.className = "_ex_btn_analyze circle";
  button.style.marginLeft = 'auto';
  button.style.marginRight = '10px';
  const link = div.querySelector('a.css-b9ade');
  if (!link) return;
  addButtonEventListener(button, link);

  // Append the button to the child div
  link.append(button);
}

const initialize = () => {
  // Find the target div
  const targetDivs = document.querySelectorAll(".g-table-tbody-virtual-holder-inner > .g-table-row"); // Replace with your selector
  if (!targetDivs.length) {
    setTimeout(initialize, 1000);
    return;
  }
  setTimeout(() => {
    targetDivs.forEach((targetDiv: any) => {
      // Find all child divs within the target div
      const childDiv = targetDiv.querySelector("div.g-table-cell.g-table-cell-fix-left");
      addButton(childDiv);
    });
  }, 1000);
}

setTimeout(initialize, 1000);