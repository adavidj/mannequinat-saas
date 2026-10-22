import { describe, expect, it } from 'vitest';

import { fcfaAmountSchema } from '../src/index.js';

describe('fcfaAmountSchema', () => {
  it('accepts non-negative integer FCFA amounts', () => {
    expect(fcfaAmountSchema.parse(2_000)).toBe(2_000);
  });

  it('rejects decimal FCFA amounts', () => {
    expect(fcfaAmountSchema.safeParse(2_000.5).success).toBe(false);
  });
});
