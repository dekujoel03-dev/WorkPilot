export function calculateProjectProgress(total: number, done: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
