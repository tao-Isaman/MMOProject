// Small helpers the skill trees share: a share as a percent ("15%") and a value that grows by
// rank (a at rank 1, b more each rank after).
export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const lin = (a: number, b: number) => (r: number) => a + b * (r - 1);
