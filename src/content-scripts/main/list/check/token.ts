export async function checkToken(pathname: string): Promise<any> {
  const pairAddress = pathname.substring(pathname.lastIndexOf('/') + 1).split('?')[0];
  // console.log("Checking Token...", pairAddress);
  let tokenAddress  = '';
  let tokenName = '', tokenSymbol = '';

  try {
    const getPairUrl = `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`;
    let response = await fetch(getPairUrl);
    let data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
        tokenAddress = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        return {
          address: data.pairs[0].baseToken.address,
          symbol: data.pairs[0].baseToken.symbol,
          name: data.pairs[0].baseToken.name,
        }
    }else {
      const getTokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${pairAddress}`;
      response = await fetch(getTokenUrl);
      data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        tokenAddress = data.pairs[0].baseToken.address;
        // const quoteToken = data.pairs[0].quoteToken.address;
        return {
          address: data.pairs[0].baseToken.address,
          symbol: data.pairs[0].baseToken.symbol,
          name: data.pairs[0].baseToken.name,
        }
      }
    }

    // console.log("Token Name", tokenAddress);
    if (!tokenAddress) {
      return null;
    }
  } catch (error) {
    // console.error("Error fetching data:", error);
  }
  return null;
}