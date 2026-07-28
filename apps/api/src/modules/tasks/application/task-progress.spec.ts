import { calculateProjectProgress } from '@work-pilot/shared';

describe('calculateProjectProgress', () => {
  it('returns 0 when there are no tasks', () => {
    expect(calculateProjectProgress(0, 0)).toBe(0);
  });

  it('returns rounded percentage', () => {
    expect(calculateProjectProgress(5, 1)).toBe(20);
    expect(calculateProjectProgress(3, 2)).toBe(67);
    expect(calculateProjectProgress(4, 4)).toBe(100);
  });
});
