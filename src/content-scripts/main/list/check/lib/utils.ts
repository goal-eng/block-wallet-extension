export function formatNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(2);
}

export function formatAddressV3(address: string): string {
  if (!address) return '-';
  const short = `${address.slice(0,5)}...${address.slice(-4)}`;
  return `${short}`;
}