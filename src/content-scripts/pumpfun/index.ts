import './index.css';
import { config } from '@common/config';
import { addButtonEventListener } from '../main';

// Target a parent container where new divs are being generated
const targetNode = document.body; // Adjust this selector based on your use case

// Configuration for the observer (observe child additions)
const config_observe = { childList: true, subtree: true };
document.body.firstChild
// Callback to execute when mutations are observed
const callback = (mutationsList: any) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      // Loop through added nodes
      mutation.addedNodes.forEach((node: any) => {
        console.log(node.nodeType, node.tagName, node.className);
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
          // Check if the added node is the desired div
          if (node.classList.contains('relative') && node.classList.contains('group')) {
            // Create a button and append to the new div
            addButton(node);
          }else {
            const targetDivs = document.querySelectorAll(".relative.group");
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
  const link = div.firstChild;
  link && console.log(link.tagName, link.className);
  if (!link || link.tagName != 'A' || !link.href || link.href.indexOf('/coin/') == -1) return;
  const wrapperDiv = div.querySelector('.gap-1.grid.h-fit');
  if (!wrapperDiv) return;
  const analyzeBtn = link.querySelector('._ex_btn_analyze');
  if(analyzeBtn) return;
  // Create a button element
  const button = document.createElement("button");
  button.innerHTML = "Analyze";
  button.className = "_ex_btn_analyze rounded";
  addButtonEventListener(button);

  // Append the button to the child div
  wrapperDiv.append(button);
}

const initialize = () => {
  // Find the target div
  const targetDivs = document.querySelectorAll("div.relative.group"); // Replace with your selector
  if (!targetDivs.length) {
    setTimeout(initialize, 1000);
  }else {
    setTimeout(() => {
      targetDivs.forEach((targetDiv: any) => {
        // Find all child divs within the target div
        addButton(targetDiv);
      });
    }, 1000);
  }
}

setTimeout(initialize, 1000);