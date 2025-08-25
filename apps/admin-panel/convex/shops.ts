import { mutation, query } from './_generated/server';

import { v } from 'convex/values';

export const listShops = query({
  handler: async (ctx) => {
    return ctx.db.query('shops').collect();
  },
});

export const getShop = query({
  args: { id: v.id('shops') },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query('shops')
      .filter((q) => q.eq(q.field('_id'), args.id))
      .first();
    return shop ?? null;
  },
});

export const createShop = mutation({
  args: {
    shopId: v.string(),
    owner: v.string(),
    name: v.string(),
    logo: v.optional(v.string()),
    location: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('shops', {
      ...args,
      logo: args.logo ?? '', // Ensure logo is always a string
    });
    return id;
  },
});
