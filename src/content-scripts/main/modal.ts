import './index.css';

const globalCSS = `
._ex_modal {
    position: fixed;
    z-index: 9999;
    border-radius: 7px;
    background-color: #151419;
    padding: 20px;
    font-size: 16px;
    max-width: 400px;
    visibility: hidden;
}
._ex_modal > ._ex_block {
    border-radius: 7px;
    background-color: #1a1c24;
    padding: 20px;
    margin-top: 20px;
}
._ex_modal > ._ex_block:first-of-type {
    margin-top: 0px;
}
._ex_modal > ._ex_block ._ex_title {
    font-weight: 700;
    color: white;
    font-size: 18px;
}
._ex_modal > ._ex_block ._ex_sub_title {
    font-size: 18px;
    color: #5fc43e;
}
._ex_modal > ._ex_block > ._ex_block_rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

._ex_modal > ._ex_block ._ex_label {
    font-size: 16px;
    font-weight: 700;
    color: white;
}
._ex_modal > ._ex_block ._ex_result {
    font-size: 14px;
    border-radius: 3px;
    background-color: #141720;
    color: #682aee;
    padding: 5px;
}
._ex_modal > ._ex_block ._ex_result > ._ex_detail {
    color: #454966;
}
._ex_btn_analyze {
    background-color: #666;
    color: white;
    padding: 2px 8px;
}
._ex_btn_analyze.rounded {
    border-radius: 7px;
}
._ex_btn_analyze.circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    padding: 0px;
}
._ex_btn_analyze:hover {
    background-color: #333;
    color: white;
}`;

// Create a <style> element
const styleElement = document.createElement('style');
styleElement.innerHTML = globalCSS;

// Append the <style> element to the <head>
document.head.appendChild(styleElement);

const modalElement = document.createElement('div');
modalElement.className = '_ex_modal';
modalElement.id = '_ex_modal';

modalElement.innerHTML = `
<div class="_ex_block">
    <span class="_ex_title">$ONLYCHILLS</span>
    <span class="_ex_sub_title">Aiva Token Analysis</span>
</div>
<div class="_ex_block">
    <div class="_ex_block_rows">
        <div class="_ex_block_row">
            <span class="_ex_label">Top 10 Holers:</span>
            <span class="_ex_result">29.11%</span>
        </div>
        <div class="_ex_block_row">
            <span class="_ex_label">Whale Wallets:</span>
            <span class="_ex_result">
                2
                <span class="_ex_detail">[View wallet: 1, 2]</span>
            </span>
        </div>
    </div>
</div>
`;

document.body.appendChild(modalElement);

const dropdown = modalElement;

const handleClick = (button: any) => {
  showModal(button);
}

const showModal = (button: any) => {
  if (!dropdown) return;
  // Get button's position on the screen
  const rect = button.getBoundingClientRect();

  // Calculate where to place the dropdown (below or above the button)
  const dropdownHeight = dropdown.offsetHeight || dropdown.scrollHeight || dropdown.clientHeight;
  const viewportHeight = window.innerHeight;

  // Check if there's enough space below the button
  if (rect.bottom + dropdownHeight <= viewportHeight) {
    // Place dropdown below the button
    dropdown.style.top = rect.bottom + 'px';
  } else {
    // Otherwise, place it above the button
    dropdown.style.top = rect.top - dropdownHeight + 'px';
  }

  // Position it horizontally aligned with the button
  dropdown.style.left = rect.left + 'px';

  // Toggle visibility
  dropdown.style.visibility = (dropdown.style.visibility === 'visible') ? 'hidden' : 'visible';
}

document.body.addEventListener('click', (event: any) => {
    if(dropdown && !event.target.closest('#_ex_modal')) {
        dropdown.style.visibility = 'hidden';
    }
});

export const addButtonEventListener = (button: any) => {
    button.addEventListener('click', (event: any) => {
        if (event.target && (event.target.classList.contains('_ex_btn_analyze'))) {
            event.preventDefault();
            event.stopPropagation();
            handleClick(event.target);
        }else if (event.target.closest('button._ex_btn_analyze')) {
            event.preventDefault();
            event.stopPropagation();
            handleClick(event.target.closest('button._ex_btn_analyze'));
        }
    });
}
// Event delegation for dynamically added buttons