export const checkTabs = (tabs: any): boolean => {
    if (!tabs.length) return false;
    // if (!tabs.length || hostPermissions.filter((host) => new RegExp(host.replace(/\/\*/, '\\w*')).test(tabs[0].url)).length == 0) return false;
    return true;
}

export const getRemainingTimeString = (mili: number) => {
    const seconds = Math.floor(mili / 1000);
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
};

export const parseLamports = (lamports: number) => {
    return (lamports / 1000000000);
};

export const formatDecimals = (value: number) => {
    return (value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};