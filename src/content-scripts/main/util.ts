const MAX_SCORE = 10000;
const DANGER_SCORE = 40;
const WARNING_SCORE = 75;

export const getLevel = (riskLevel: string): string => {
    riskLevel = riskLevel.toLowerCase();
    return riskLevel.startsWith('warn') ? 'warning' : (riskLevel.startsWith('danger') ? 'danger' : '');
}

export const getScore = (scoreRisk: number): number => {
    if (scoreRisk < 0) return 0;
    const score = 101 - Math.min(scoreRisk, MAX_SCORE) * 100 / MAX_SCORE;
    return Math.min(100, Math.floor(score * 100) / 100);
}

export const getScoreClassName = (scoreRisk: number) => {
    const score = getScore(scoreRisk);
    return score < DANGER_SCORE ? 'danger' : (score < WARNING_SCORE ? 'warning' : '');
}