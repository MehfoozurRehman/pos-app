import { mutation, query } from './_generated/server';

import { v } from 'convex/values';

export const listPayments = query({
  handler: async (ctx) => {
    return ctx.db.query('payments').collect();
  },
});

export const getPaymentsForShop = query({
  args: { shopId: v.id('shops') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('payments')
      .filter((q) => q.eq(q.field('shop'), args.shopId))
      .collect();
  },
});

export const createPayment = mutation({
  args: { shop: v.id('shops'), month: v.string(), year: v.string() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('payments', args);
    return id;
  },
});

// Simple analytics: count payments per shop
export const paymentsCountPerShop = query({
  handler: async (ctx) => {
    const payments = await ctx.db.query('payments').collect();
    const counts: Record<string, number> = {};
    for (const p of payments) {
      const shopId = String(p.shop);
      counts[shopId] = (counts[shopId] || 0) + 1;
    }
    return counts;
  },
});
