import { Connection, PublicKey } from '@solana/web3.js';
import { BundleAnalysisResponse } from './lib/types';
import { RPC_URL } from './lib/constants';
import { formatNumber } from './lib/utils';

export interface Holder {
  owner: string;
  balance: number;
  classification?: string; // optional, assigned later
}

interface MintInfo {
  mint: string;
  decimals: number;
  supply: bigint;
  isInitialized: boolean;
  freezeAuthority: string;
  mintAuthority: string;
}

type HeliusMethod =
  | 'searchAssets'
  | 'getBalance'
  | 'getTokenAccounts'
  | 'getAccountInfo'
  | 'getMultipleAccounts'
  | 'getTokenLargestAccounts';

const fetchHelius = async (method: HeliusMethod, params: any) => {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'request-id',
        method: method,
        params: params, // some methods require objects, some require arrays
      }),
    });

    // Check for rate limiting response
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!response.ok) {
      throw new Error(
        `Helius API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(
        `Helius API error: ${data.error.message || JSON.stringify(data.error)}`,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      return {
        status: 429,
        error: 'Helius API request failed: Too many requests',
      };
    }
    if (error instanceof Error) {
      throw new Error(`Helius API request failed: ${error.message}`);
    }
    throw new Error('Helius API request failed with unknown error');
  }
};

async function getMintAccountInfo(mint: string): Promise<MintInfo> {
  const data = await fetchHelius('getAccountInfo', [
    mint,
    { encoding: 'jsonParsed' },
  ]);

  if (!data.result || !data.result.value) {
    throw new Error(`No account info found for mint: ${mint}`);
  }

  const value = data.result.value;
  if (!value.data || !value.data.parsed || value.data.parsed.type !== 'mint') {
    throw new Error(`Account is not a valid SPL mint: ${mint}`);
  }

  const info = value.data.parsed.info;
  return {
    mint,
    decimals: info.decimals,
    supply: BigInt(info.supply),
    isInitialized: info.isInitialized,
    freezeAuthority: info.freezeAuthority,
    mintAuthority: info.mintAuthority,
  };
}

function mapTokenDecimals(
  data: BundleAnalysisResponse,
  decimals: number,
): void {
  const tokenKeys = [
    'total_tokens',
    'tokens',
    'total_tokens_bundled',
    'distributed_amount',
    'holding_amount',
    'total_holding_amount',
  ];

  function adjustValue(value: any): any {
    return typeof value === 'number' ? value / Math.pow(10, decimals) : value;
  }

  function traverse(obj: any): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      if (tokenKeys.includes(key) && typeof obj[key] === 'number') {
        obj[key] = adjustValue(obj[key]);
      } else if (typeof obj[key] === 'object') {
        traverse(obj[key]);
      }
    }
  }

  traverse(data);
}

const analyzeMintBundles = async (mintAddress: string): Promise<{
  success: boolean;
  data?: BundleAnalysisResponse;
  error?: string;
}> => {
  try {
    const response = await fetch(
      `https://trench.bot/api/bundle/bundle_advanced/${mintAddress}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch bundle analysis');
    }

    const analysis: BundleAnalysisResponse = await response.json();

    return { success: true, data: analysis };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to analyze bundles',
    };
  }
}

export async function checkBundle (mintAddress: string) {
  try {
    const analysis = await analyzeMintBundles(mintAddress);

    if (!analysis || !analysis.data) {
      return {
        success: false,
        error: 'No data available',
      };
    }

    // Get mint info for calculating decimals
    const accountInfo = await getMintAccountInfo(mintAddress);

    // Recalculate token fields using decimals from mint info
    if (analysis.data) {
      mapTokenDecimals(analysis.data, accountInfo.decimals);
    }

    return {
      success: true,
      data: {
        mintAddress,
        analysis: analysis.data,
      },
      suppressFollowUp: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to analyze bundles',
    };
  }
}

export const getBundleReports = (data: {analysis: BundleAnalysisResponse}): string => {
  if (!data || !data.analysis) return '';

  const analysis = data.analysis;
  let html = `
  <div class="_ex_result">
    <div class="_ex_label">Ticker:</div>
    <div class="_ex_value">${analysis.ticker.toUpperCase()}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Total Bundles:</div>
    <div class="_ex_value">${analysis.total_bundles}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Total SOL Spent:</div>
    <div class="_ex_value">${formatNumber(analysis.total_sol_spent)} SOL</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Bundled Total:</div>
    <div class="_ex_value">${analysis.total_percentage_bundled.toFixed(2)}%</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Held Percentage:</div>
    <div class="_ex_value">${analysis.total_holding_percentage.toFixed(2)}%</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Held Tokens:</div>
    <div class="_ex_value">${formatNumber(analysis.total_holding_amount)}</div>
  </div>
  <div class="_ex_result">
    <div class="_ex_label">Bonded:</div>
    <div class="_ex_value">${analysis.bonded ? 'Yes' : 'No'}</div>
  </div>
  `
  return html;
}