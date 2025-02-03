import './index.css';
import { config } from '@common/config';
import { addButtonEventListener } from '../main/modal';

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
          if (node.classList.contains('sBVBv2HePq7qYTpGDmRM') && node.classList.contains('VTmpJ0jdbJuSJQ4HKGlN')) {
            // Create a button and append to the new div
            addButton(node);
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
  const wrapperDiv = div.querySelector('.CZ9XtNP_BJSquWvM6_r8');
  if (!wrapperDiv) return;
  // Create a button element
  const button = document.createElement("button");
  button.innerHTML = "<span class='c-icon c-icon--flash c-icon--base'></span>";
  button.className = "_ex_btn_analyze WONu4jRBwJmFo3FD6XwP c-btn c-btn--lt u-px-xs";
  button.style.marginRight = '5px';

  // Append the button to the child div
  wrapperDiv.prepend(button);
  addButtonEventListener(button);
}

const initialize = () => {
  // Find the target div
  const targetDivs = document.querySelectorAll(".dbIzlq2D2W9wqE6dpwdZ"); // Replace with your selector
  if (!targetDivs.length) {
    setTimeout(initialize, 1000);
    return;
  }
  setTimeout(() => {
    targetDivs.forEach((targetDiv: any) => {
      // Find all child divs within the target div
      const childDivs = targetDiv.querySelectorAll("div.sBVBv2HePq7qYTpGDmRM.VTmpJ0jdbJuSJQ4HKGlN");
    
      // Iterate through each child div and add a button
      childDivs.forEach((childDiv: any) => {
        addButton(childDiv);
      });
    });
  }, 1000);
}

setTimeout(initialize, 1000);