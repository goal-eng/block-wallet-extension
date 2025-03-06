import { addButtonEventListener } from '../main/list/modal';

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
        console.log(node.nodeType, node.tagName, node.classList);
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
          // Check if the added node is the desired div
          if (node.classList.contains('c-trades-table__tr')) {
            addButton(node);
          }
          else if (node.classList.contains('c-trades-table__td') && node.querySelector("img.Ws2jNiIpXgXxTik0lFtO")) {
            // Create a button and append to the new div
            addButton(node.closest(".c-trades-table__tr"));
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
  const wrapperDiv = div.querySelector('.l-row.l-row-gap--xxs');
  if (!wrapperDiv) return;
  // Create a button element
  const button = document.createElement("button");
  button.innerHTML = "R";
  button.className = "_ex_btn_analyze circle WONu4jRBwJmFo3FD6XwP c-btn c-btn--lt u-px-xs";
  button.style.margin = "auto";

  // Append the button to the child div
  wrapperDiv.append(button);
  addButtonEventListener(button, div);
}

const initialize = () => {
  // Find the target div
  const targetDivs = document.querySelectorAll(".c-grid-table__body"); // Replace with your selector
  if (!targetDivs.length) {
    setTimeout(initialize, 1000);
    return;
  }
  setTimeout(() => {
    targetDivs.forEach((targetDiv: any) => {
      // Find all child divs within the target div
      const childDivs = targetDiv.querySelectorAll(".c-trades-table__tr");
      // Iterate through each child div and add a button
      childDivs.forEach((childDiv: any) => {
        addButton(childDiv);
      });
    });
  }, 1000);
}

setTimeout(initialize, 1000);