import { ConfirmedSignatureInfo, Connection, PublicKey } from "@solana/web3.js";
import { formatAddressV3, formatNumber } from "./lib/utils";
import { getLevel } from "../../util";

let lastMintAddress = '', lastReport: any = null;
let accountInfoMap: {[key:string]: any} = {};
fetch('https://api.rugcheck.xyz/public/known_accounts.json').then(async (response: Response) => {
    if (!response.ok) return;
    accountInfoMap = await response.json();
}).catch((error) => {
    // console.log(error);
});

async function updateReport (mintAddress: string) {
    if (lastMintAddress !== mintAddress) {
        const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report`);
        if (!response.ok) {
            lastReport = null;
            return {
                success: false,
                error: response.statusText
            }
        }
        const data = await response.json();
        lastReport = data;
        lastMintAddress = mintAddress;
        accountInfoMap = {
            ...accountInfoMap,
            ...data.knownAccounts
        }
    }
}

export async function checkScore(mintAddress: string) {
    await updateReport(mintAddress);
    if (!lastReport) {
        return -1;
    }
    return lastReport.score || 0;
}

export async function checkRisks(mintAddress: string) {
    await updateReport(mintAddress);
    if (!lastReport || !lastReport.risks || !lastReport.risks.length) {
        return {
            success: false,
            error: 'No Risks exist'
        }
    }
    return {
        success: true,
        data: lastReport.risks
    };
}

export async function checkOverview (mintAddress: string) {
    await updateReport(mintAddress);
    if (!lastReport) {
        return {
            success: false,
            error: 'Overview Error'
        }
    }

    let lpLocked = 0;
    let totalMarketLiquidity = lastReport.totalMarketLiquidity;
    if (lastReport.lockers) {
        lpLocked = Object.values(lastReport.lockers).reduce((acc: number, item: any) => acc + item.usdcLocked, 0);
    }
    return {
        success: true,
        data: {
            creator: lastReport.creator,
            holders: lastReport.totalHolders,
            mintAuthority: lastReport.mintAuthority,
            lpProviders: lastReport.totalLPProviders,
            lpLocked: totalMarketLiquidity ? lpLocked * 100 / totalMarketLiquidity : 0,
        }
    }
}
export async function checkTopHolders (mintAddress: string) {
    await updateReport(mintAddress);
    if (!lastReport || !lastReport.topHolders || !lastReport.topHolders.length) {
        return {
            success: false,
            error: 'No holders exist'
        }
    }
    return {
        success: true,
        data: lastReport.topHolders
    }
}

/**
 * Option 1: Insider Activity
 * Using the token mint address as a proxy, fetch recent signatures and group by slot.
 * Returns an object mapping each slot (with >1 tx) to an array of fee-payer addresses.
 */
export async function checkInsiders(tokenAddress: string, connection: Connection) {
    await updateReport(tokenAddress);
    try {
        const pubkey = new PublicKey(tokenAddress);
        const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 100 });
        const transactionsBySlot: { [key: number]: ConfirmedSignatureInfo[] } = {};
        for (const sig of signatures) {
            if (!transactionsBySlot[sig.slot]) transactionsBySlot[sig.slot] = [];
            transactionsBySlot[sig.slot].push(sig);
        }
        const insiderActivity: { [key: string]: number[] } = {};
        for (const slot in transactionsBySlot) {
            if (transactionsBySlot[slot].length > 1) {
                // For each signature in this slot, fetch the transaction to get the fee payer
                for (const sigInfo of transactionsBySlot[slot]) {
                    try {
                        const tx = await connection.getTransaction(sigInfo.signature, {
                            commitment: 'confirmed',
                            maxSupportedTransactionVersion: 0
                        });
                        if (tx) {
                            const sender = tx.transaction.message.getAccountKeys().get(0);
                            if (sender) {
                                const address = sender.toBase58();
                                if (!insiderActivity[address]) insiderActivity[address] = [];
                                insiderActivity[address].push(Number(slot));
                            }
                        }
                    } catch (e) {
                        // console.log(e);
                    }
                }
            }
        }
        if (Object.keys(insiderActivity).length === 0) {
            return {
                success: false,
                error: 'No insider activity found'
            }
        }
        return {
            success: true,
            data: insiderActivity
        }
    } catch (e) {
        // console.log('Error fetching insider activity', e);
    }
    return {
        'success': false,
        'error': 'No insider activity found'
    };
}

export const getTopHolderReports = (holders: any[]) => {
    if (!holders || !holders.length) return '';

    let html: string = `<table>
        <thead>
            <tr>
                <th>Account</th>
                <th>Amount</th>
                <th>Percentage</th>
            </tr>
        </thead>
    <tbody>`;
    holders.slice(0, 5).map((holder: any) => {
        if (!holder.uiAmount) return;

        const accountInfo = accountInfoMap[holder.owner];
        const account =  accountInfo ? accountInfo.name : formatAddressV3(holder.owner);
        html += `<tr>
            <td><a href="https://solana.fm/address/${holder.owner}" target="_blank">${account}</a></td>
            <td class="right">${formatNumber(holder.uiAmount)}</td>
            <td class="right">${holder.pct.toFixed(2)}%</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

export const getInsiderReports = (insiders: { [key: string]: number[] }) => {
    if (!insiders) return '';

    let html: string = `<table>
        <thead>
            <tr>
                <th>Account</th>
                <th>Blocks</th>
            </tr>
        </thead>
    <tbody>`;
    Object.keys(insiders).slice(0, 10).map((owner: any) => {
        const accountInfo = accountInfoMap[owner];
        const account =  accountInfo ? accountInfo.name : formatAddressV3(owner);
        html += `<tr>
            <td><a href="https://solana.fm/address/${owner}" target="_blank">${account}</a></td>
            <td class="right">${formatNumber(insiders[owner].length)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

export const getOverviewReports = (data: any): string => {
  if (!data) return '';

  let html = `
  <div class="_ex_result">
    <div class="_ex_label">Creator:</div>
    <div class="_ex_value">${formatAddressV3(data.creator)}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Holders:</div>
    <div class="_ex_value">${data.holders}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Mint Authority:</div>
    <div class="_ex_value">${formatAddressV3(data.mintAuthority)}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">LP Providers:</div>
    <div class="_ex_value">${data.lpProviders}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">LP Locked:</div>
    <div class="_ex_value">${data.lpLocked.toFixed(2)}%</div>
  </div>
  `
  return html;
}

export const getRiskReports = (data: any): string => {
    if (!data || !data.length) return '';
    let html = '<div class="_ex_wallet_block_rows">';
    data.forEach((risk: any) => {
        html += `
        <div class="_ex_wallet_block_row _ex_pro">
            <span class="_ex_wallet_label">${risk.name + ' ' + risk.value}:</span>
            <span class="${'_ex_wallet_result badge badge-' + getLevel(risk.level) }" style="text-transform: uppercase;">${getLevel(risk.level)}</span>
        </div>`;
    });
    html += "</div>";
    return html;
}