import { getLevel, getScore, getScoreClassName } from "../util";

const globalCSS = `
._ex_wallet_modal {
    position: fixed;
    z-index: 9999;
    border-radius: 8px;
    background-color: #151419;
    padding: 16px;
    font-size: 16px;
    visibility: hidden;
    border: 1px solid #222;
    box-shadow: 0px 4px 10px #000;
}
._ex_wallet_modal > ._ex_wallet_block {
    border-radius: 7px;
    background-color: #1a1c24;
    padding: 10px 20px;
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}
._ex_wallet_block:first-of-type {
    margin-top: 0px;
}
._ex_wallet_title {
    font-weight: 700;
    color: white;
    font-size: 18px;
}
._ex_wallet_sub_title {
    font-size: 18px;
    color: #5fc43e;
}
._ex_wallet_modal .danger {
    color:rgb(250, 54, 58) !important;
}

._ex_wallet_modal .warning {
    color: #faad14 !important;
}

._ex_wallet_modal .badge, ._ex_modal .badge {
    font-size: 14px;
    background-color:rgb(57, 165, 21) !important;
    color: white !important;
}

._ex_wallet_modal .badge-danger, ._ex_modal .badge-danger {
    background-color:rgb(216, 17, 20) !important;
    color: white !important;
}

._ex_wallet_modal .badge-warning, ._ex_modal .badge-warning {
    background-color:rgb(204, 142, 17) !important;
    color: white !important;
}

._ex_wallet_block_rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}
._ex_wallet_block_row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}
._ex_wallet_label {
    font-size: 16px;
    color: white;
}
._ex_wallet_result {
    font-size: 14px;
    border-radius: 3px;
    background-color: #141720;
    color: #5fc43e;
    padding: 5px;
}
._ex_wallet_result > ._ex_wallet_detail {
    color: #454966;
}`;

// Create a <style> element
const styleElement = document.createElement('style');
styleElement.innerHTML = globalCSS;

// Append the <style> element to the <head>
document.head.appendChild(styleElement);

const modalElement = document.createElement('div');
modalElement.className = '_ex_wallet_modal';
modalElement.id = '_ex_wallet_modal';

modalElement.innerHTML = `
<div class="_ex_wallet_block _ex_wallet_first">
    
</div>
<div class="_ex_wallet_block _ex_wallet_second">
    <div class="_ex_wallet_block_rows">
        <div class="_ex_wallet_block_row">
            <span class="_ex_wallet_label">Top 10 Holers:</span>
            <span class="_ex_wallet_result">29.11%</span>
        </div>
        <div class="_ex_wallet_block_row">
            <span class="_ex_wallet_label">Whale Wallets:</span>
            <span class="_ex_wallet_result">
                2
                <span class="_ex_wallet_detail">[View wallet: 1, 2]</span>
            </span>
        </div>
    </div>
</div>
`;

document.body.appendChild(modalElement);

const dropdown = modalElement;

let modalInfo = {
    isError: true,
    name: "",
    symbol: "",
    score: 0,
    risks: []
};

let isProMode = false;


export const rebuildModal = (info: any = null) => {
    if (!info || info.isError) {
        modalInfo.isError = true;
        return;
    }
    modalInfo = { isError: false, ...info};
    const titleNode = dropdown.querySelector('._ex_wallet_first');
    if (titleNode) {
        if (isProMode && getScoreClassName(modalInfo.score) == 'danger') {
            titleNode.innerHTML = `<span class="_ex_wallet_title danger">DANGER!!! DON'T TRADE!</span>`;
        }else {
            titleNode.innerHTML = `
                <span class="_ex_wallet_title">$${modalInfo.symbol}</span>
                <span class="_ex_wallet_sub_title">${modalInfo.name}</span>
            `;
        }
    }

    const risksNode = dropdown.querySelector('._ex_wallet_block_rows');
    let riskHtml = `
        <div class="_ex_wallet_block_row">
            <span class="_ex_wallet_label">Total score:</span>
            <span class="${'_ex_wallet_result ' + getScoreClassName(Number(modalInfo.score || 0))}">${getScore(modalInfo.score)} / 100</span>
        </div>`;
    if (isProMode) {
        modalInfo.risks && modalInfo.risks.length > 0 && (riskHtml += `<div class="_ex_pro" style="border-bottom: 1px solid #303030;"></div>`);
        modalInfo.risks.forEach((risk: any) => {
            riskHtml += `
            <div class="_ex_wallet_block_row _ex_pro">
                <span class="_ex_wallet_label">${risk.name + ' ' + risk.value}:</span>
                <span class="${'_ex_wallet_result badge badge-' + getLevel(risk.level) }" style="text-transform: uppercase;">${getLevel(risk.level)}</span>
            </div>`;
        });
    }
    risksNode && (risksNode.innerHTML = riskHtml);
}

export const showModalDetails = (isShow: boolean) => {
    if (isProMode == isShow) return;
    isProMode = isShow;
    rebuildModal(modalInfo);
}

export const hideModal = () => {
    dropdown && (dropdown.style.visibility = 'hidden');
}

export const showModal = (button: any) => {
  if (!dropdown || dropdown.style.visibility == 'visible' || modalInfo.isError) return;
  // Get button's position on the screen
  const rect = button.getBoundingClientRect();

  // Calculate where to place the dropdown (below or above the button)
  const dropdownWidth = dropdown.offsetWidth || dropdown.scrollWidth || dropdown.clientWidth;
  const dropdownHeight = dropdown.offsetHeight || dropdown.scrollHeight || dropdown.clientHeight;
  const viewportHeight = window.innerHeight;

  // Check if there's enough space below the button
  if (rect.bottom + dropdownHeight <= viewportHeight) {
    // Place dropdown below the button
    dropdown.style.top = (rect.bottom + 2) + 'px';
  } else {
    // Otherwise, place it above the button
    dropdown.style.top = (rect.top - dropdownHeight - 2) + 'px';
  }

  // Position it horizontally aligned with the button
  dropdown.style.left = (rect.left - dropdownWidth + rect.width) + 'px';

  // Toggle visibility
  dropdown.style.visibility = (dropdown.style.visibility === 'visible') ? 'hidden' : 'visible';
}

// document.body.addEventListener('click', (event: any) => {
//     if(dropdown && !event.target.closest('#_ex_wallet_modal')) {
//         dropdown.style.visibility = 'hidden';
//     }
// });