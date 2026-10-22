import { z } from 'zod';

/** Montants monétaires stockés en FCFA entiers, jamais en flottants. */
export const fcfaAmountSchema = z.number().int().nonnegative();

export type FcfaAmount = z.infer<typeof fcfaAmountSchema>;
