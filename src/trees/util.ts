// Small helpers the skill trees share: a share as a percent ("15%", "2.5%") and a value that grows by
// rank (a at rank 1, b more each rank after).
export const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;
export const lin = (a: number, b: number) => (r: number) => a + b * (r - 1);
