import { describe, expect, it } from 'vitest';
import { canTransition, getAllowedTransitions } from './jobTransitions';

describe('jobTransitions', () => {
  it('allows pending -> running only', () => {
    expect(getAllowedTransitions('pending')).toEqual(['running']);
    expect(canTransition('pending', 'running')).toBe(true);
    expect(canTransition('pending', 'completed')).toBe(false);
    expect(canTransition('pending', 'failed')).toBe(false);
  });

  it('allows running -> completed / failed', () => {
    expect(canTransition('running', 'completed')).toBe(true);
    expect(canTransition('running', 'failed')).toBe(true);
    expect(canTransition('running', 'pending')).toBe(false);
  });

  it('blocks terminal transitions', () => {
    expect(getAllowedTransitions('completed')).toEqual([]);
    expect(getAllowedTransitions('failed')).toEqual([]);
    expect(canTransition('completed', 'running')).toBe(false);
    expect(canTransition('failed', 'running')).toBe(false);
  });
});
