import { checkInsiders, checkBundle, checkToken, checkTopHolders } from './check';
import { getBundleReports } from './check/bundle';
import { checkOverview, checkRisks, checkScore, getInsiderReports, getOverviewReports, getRiskReports, getTopHolderReports } from './check/rugcheck';
import { RPC_URL } from './check/lib/constants';
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { getScore, getScoreClassName } from '../util';

const _SOLANA_CONNECTION = new Connection(RPC_URL);

const globalCSS = `
._ex_modal {
    position: fixed;
    z-index: 9999;
    border-radius: 8px;
    background-color: #151419;
    padding: 16px;
    font-size: 16px;
    visibility: hidden;
    border: 1px solid #222;
    box-shadow: 0px 4px 10px #000;
    overflow: auto;
    display: flex;
    flex-direction: column;
}
._ex_modal > ._ex_block {
    border-radius: 7px;
    background-color: #1a1c24;
    padding: 10px 20px;
    margin-top: 12px;
}
._ex_modal > ._ex_block._ex_block_first {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}
._ex_modal > ._ex_block._ex_block_second {
    padding: 10px 0px;
    display: flex;
    flex-grow: 1;
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
._ex_modal > ._ex_block > ._ex_block_body {
    display: flex;
    flex-direction: column;
    background-color: #1a1c24;
    padding: 5px 20px;
    border-radius: 7px;
    min-width: 100%;
}
._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_header {
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
}
._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_content {
    flex-grow: 1;
    overflow: auto;
    padding: 10px 0px;
    position: relative;
    min-height: 150px;
    max-height: 500px;
}

._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_content::after {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a1c24;
}

._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_content.loading::after {
    content: 'Loading...';
    color: #faad14 !important;
}

._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_content.error {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fa363a !important;
}

._ex_modal > ._ex_block > ._ex_block_body > ._ex_block_content.no-data::after {
    content: 'No data to show';
    color: #faad14 !important;
}

._ex_modal > ._ex_block > ._ex_block_rows {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 5px;
    cursor: pointer;
}
._ex_modal > ._ex_block > ._ex_block_rows > ._ex_block_row {
    padding: 5px 20px 0px 20px;
    position: relative;
    cursor: pointer;
}
._ex_modal > ._ex_block > ._ex_block_rows > ._ex_block_row:hover {
    background: #214e12;
}
._ex_modal > ._ex_block > ._ex_block_rows > ._ex_block_row > ._ex_block_item::after {
    content: '>';
    right: 25px;
    top: 10px;
    position: absolute;
}

._ex_modal > ._ex_block > ._ex_block_rows > ._ex_block_row > ._ex_block_item {
    background: transparent;
    border: none;
    outline: none;
    border-bottom: 1px solid #333;
    padding: 5px 30px 5px 5px;
    width: 100%;
    text-align: left;
    font-size: 16px;
    font-weight: 700;
    color: white;
}

._ex_modal .danger {
    color:#fa363a !important;
}
._ex_modal .warning {
    color: #faad14 !important;
}
._ex_modal > ._ex_block ._ex_result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
}

._ex_modal > ._ex_block ._ex_label {
    font-size: 14px;
    color: white;
}
._ex_modal > ._ex_block ._ex_value {
    font-size: 14px;
    border-radius: 3px;
    background-color: #141720;
    color: #5fc43e;
    padding: 5px;
}
._ex_modal > ._ex_block ._ex_value > ._ex_detail {
    color: #454966;
}
._ex_btn_analyze {
    background-color: #7349b5;
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
    background-color: #5519b4;
    color: white;
}
#_ex_block_back_btn {
    color: white;
    background: transparent;
    border: none;
    outline: none;
    padding: 2px 5px 0px 5px;
    font-size: 20px;
}
._ex_modal table th, ._ex_modal table td {
    text-align: left;
    padding: 5px 10px;
}
._ex_modal table td.right {
    text-align: right;
}
._ex_modal table a[href] {
    text-decoration: underline;
    text-underline-offset: 5px;
}
`;

// Create a <style> element
const styleElement = document.createElement('style');
styleElement.innerHTML = globalCSS;

// Append the <style> element to the <head>
document.head.appendChild(styleElement);

const modalElement = document.createElement('div');
modalElement.className = '_ex_modal';
modalElement.id = '_ex_modal';

let tokenInfo: any = {
    address: '',
    symbol: '',
    name: ''
}
let checkInfo: any = {
    risk: {
        label: 'Risks',
        show: true
    },
    overview: {
        label: 'Overview',
        show: true
    },
    bundle: {
        label: 'Token Bundlers',
        show: true
    },
    topholder: {
        label: 'Top holders',
        show: true,
    },
}
modalElement.innerHTML = `
<div class="_ex_block _ex_block_first">
    <span class="_ex_title"></span>
    <span class="_ex_sub_title"></span>
</div>
<div class="_ex_block _ex_block_second">
    <div class="_ex_block_rows">
    </div>
    <div class="_ex_block_body">
        <div class="_ex_block_header">
            <button type="button" id="_ex_block_back_btn">&lt;</button>
            <span class="_ex_title">Developer’s Past Deployments:</span>
        </div>
        <div class="_ex_block_content loading">
        </div>
    </div>
</div>
`;

document.body.appendChild(modalElement);

const dropdown = modalElement;
const checkList = dropdown.querySelector('._ex_block_rows') as HTMLElement;
const backButton = dropdown.querySelector('#_ex_block_back_btn');
const detailPage = dropdown.querySelector('._ex_block_body') as HTMLElement;
const detailTitle = detailPage.querySelector('._ex_title') as HTMLElement;
const detailContent = dropdown.querySelector('._ex_block_content') as HTMLElement;

let isLoading = false, isError = false;
let isProMode = true;
let modalInfo: any = null;

let blockExpiry = 0;

const setProMode = (_isProMode: boolean) => {
    if (isProMode == _isProMode) return;
    isProMode = _isProMode;
    rebuildModal(modalInfo);
}

// Event delegation for dynamically added buttons
setInterval(() => {
    setProMode(Number(blockExpiry || 0) > new Date().getTime());
}, 1000);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  
  switch (event.data.type) {
      case "UPDATE_WALLET_ADDRESS":
          // Send the Phantom Wallet address to the background script
          event.data.expiry && (blockExpiry = event.data.expiry);
          break;
      default:
          break;
  }
});

const showDetailPage = (visible: boolean) => {
    if (visible) {
        detailPage.style.display = 'flex';
        checkList.style.display = 'none';
    }else {
        checkList.style.display = 'flex';
        detailPage.style.display = 'none';
    }
}

if (backButton) {
    backButton.addEventListener('click', () => {
        showDetailPage(false);
    });
}

let checkCache: any = {};
const updateDetailContent = (type: string, checkCallback: any, getReports: any) => {
    if (checkCache && checkCache[type]) {
        detailContent.classList.remove('loading');
        detailContent.innerHTML = getReports(checkCache[type]);
    }else {
        checkCallback(tokenInfo.address, _SOLANA_CONNECTION).then((result: any) => {
            detailContent.classList.remove('loading');
            // console.log(result);
            if (!result || !result.success) {
                detailContent.classList.add('error');
                detailContent.classList.remove('loading');
                detailContent.innerHTML = result.error;
                return;
            }
            checkCache[type] = result.data;
            detailContent.innerHTML = getReports(result.data);
        }).catch((reason: any) => {
            detailContent.classList.add('error');
            detailContent.classList.remove('loading');
            detailContent.innerHTML = 'Unknown Error';
        });
    }
}

const updateDetailPage = (type: string | null) => {
    if (!type || !checkInfo[type]) return;
    let info = checkInfo[type];
    detailTitle.innerHTML = info.label;
    detailContent.classList.remove('error');
    detailContent.classList.remove('no-data');
    detailContent.classList.add('loading');
    detailContent.innerHTML = '';
    if (!tokenInfo || !tokenInfo.address) return;
    switch (type) {
        case 'overview':
            updateDetailContent(type, checkOverview, getOverviewReports);
            break;
        case 'bundle':
            updateDetailContent(type, checkBundle, getBundleReports);
            break;
        case 'topholder':
            updateDetailContent(type, checkTopHolders, getTopHolderReports);
            break;
        case 'risk':
            updateDetailContent(type, checkRisks, getRiskReports);
            break;    
        // case 'insider':
        //     updateDetailContent(type, checkInsiders, getInsiderReports);
        //     break;
    }
}

const initCheckList = () => {
    if (checkList) {
        let checkListHtml = `<div class="_ex_block_row">
            <div class="_ex_wallet_block_row" style="border-bottom: 1px solid #333; padding-bottom: 5px;">
                <span class="_ex_wallet_label">Total score:</span>
                <span class="_ex_wallet_result">0 / 100</span>
            </div>
        </div>`;
        Object.keys(checkInfo).map((key: string) => {
            let info = checkInfo[key];
            checkListHtml += `
            <div class="${'_ex_block_row' + (key == 'risk' ? ' _ex_pro' : '')}">
                <button class="_ex_block_item" data-type=${key}>
                    ${info.label}:
                </button>
            </div>
            `;
        });
        checkList.innerHTML = checkListHtml;
    
        checkList.querySelectorAll('button._ex_block_item').forEach((button: Element) => {
            button.addEventListener('click', () => {
                if (isLoading || isError) return;
                const type = button.getAttribute('data-type');
                if (!type || (type == 'risk' && !isProMode)) return;
                updateDetailPage(type);
                showDetailPage(true);
            });
        });
    } 
}

initCheckList();

const handleClick = (button: any, link: any) => {
    if (link && link.href) {
        showModal(button);
        setTimeout(() => {
            if (dropdown.style.visibility != 'hidden') {
                showLoading();
                checkToken(link.href).then((data: any) => {
                    if (!data || !data.address) {
                        rebuildModal();
                        return;
                    }
                    rebuildModal(data);
                });
            }
        }, 0);
    }
}

const showLoading = () => {
    isLoading = true;
    const titleNode = dropdown.querySelector('._ex_block_first');
    titleNode && (titleNode.innerHTML = `<span class="_ex_title warning">Loading...</span>`);
}

const updateScore = (score: number) => {
    const titleNode = dropdown.querySelector('._ex_block_first');
    const scoreNode = checkList.querySelector("._ex_wallet_result");
    if (scoreNode) {
        scoreNode.classList.remove("danger", "warning");
        if (score < 0) {
            scoreNode.classList.add("warning");
            scoreNode.innerHTML = "Calculating...";
        }else {
            const className = getScoreClassName(Number(score || 0));
            if (isProMode && className == 'danger') {
                titleNode && (titleNode.innerHTML = `<span class="_ex_wallet_title danger">DANGER!!! DON'T TRADE!</span>`);
            }
            className && scoreNode.classList.add(className);
            scoreNode.innerHTML = `${getScore(score)} / 100`;
        }
    }
}
const rebuildModal = async (info: any = null) => {
    modalInfo = info;
    if (tokenInfo?.address != info?.address) {
        checkCache = {};
    }
    tokenInfo = info;
    isLoading = false;
    const titleNode = dropdown.querySelector('._ex_block_first');
    document.querySelectorAll('._ex_pro').forEach((element) => (element as HTMLElement).style.display = (isProMode ? 'block' : 'none'));
    if (titleNode) {
        if (!info) {
            isError = true;
            titleNode.innerHTML = `<span class="_ex_title warning">Load Failed. Retry in 5s.</span>`;
            updateScore(-1);
        }else {
            isError = false;
            titleNode.innerHTML = `
                <span class="_ex_title">$${ info.symbol }</span>
                <span class="_ex_sub_title">${ info.name }</span>
            `;
            const score = await checkScore(info.address);
            // console.log("Score", score);
            updateScore(score);
        }
    }
}

const showModal = (button: any) => {
  if (!dropdown) return;
  updateScore(-1);
  dropdown.style.height = 'auto';
  if (dropdown.style.visibility == 'hidden') {
      // Get button's position on the screen
      const rect = button.getBoundingClientRect();
    
      // Calculate where to place the dropdown (below or above the button)
      const dropdownHeight = dropdown.offsetHeight || dropdown.scrollHeight || dropdown.clientHeight;
      const viewportHeight = window.innerHeight;
      const dropdownWidth = dropdown.offsetWidth || dropdown.scrollWidth || dropdown.clientWidth;
      const viewportWidth = window.innerWidth;
    
      // Check if there's enough space below the button
      if (rect.bottom + dropdownHeight <= viewportHeight) {
        // Place dropdown below the button
        dropdown.style.top = rect.bottom + 'px';
      } else {
        // Otherwise, place it above the button
        if (rect.top > dropdownHeight) {
            dropdown.style.top = rect.top - dropdownHeight + 'px';
        }else {
            dropdown.style.top = '0px';
            dropdown.style.height = rect.top + 'px';
        }
      }

      if (rect.right + dropdownWidth <= viewportWidth) {
        // Place dropdown below the button
        dropdown.style.left = rect.left + 'px';
      } else {
        // Otherwise, place it above the button
        if (rect.left > dropdownWidth) {
            dropdown.style.left = rect.right - dropdownWidth + 'px';
        }else {
            dropdown.style.left = '0px';
            dropdown.style.width = rect.left + 'px';
        }
      }

      dropdown.style.visibility = 'visible';
  } else {
    hideModel();
  }
}

const hideModel = () => {
    if (!dropdown || !detailPage) return;
    showDetailPage(false);
    dropdown.style.visibility = 'hidden';
}

document.body.addEventListener('click', (event: any) => {
    if(dropdown && !event.target.closest('#_ex_modal')) {
        hideModel();
    }
});

const wrapper = document.querySelector('.custom-a3qv9n');
if (wrapper) {
    wrapper.addEventListener('scroll', () => {
        hideModel();
    });
}

export const addButtonEventListener = (button: any, link: any) => {
    button.addEventListener('click', (event: any) => {
        if (event.target && (event.target.classList.contains('_ex_btn_analyze'))) {
            event.preventDefault();
            event.stopPropagation();
            handleClick(event.target, link);
        }else if (event.target.closest('button._ex_btn_analyze')) {
            event.preventDefault();
            event.stopPropagation();
            handleClick(event.target.closest('button._ex_btn_analyze'), link);
        }
    });
}

hideModel();