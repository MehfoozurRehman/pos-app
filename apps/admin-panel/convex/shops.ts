import { hashPassword, verifyPassword } from '@/utils/encryption';
import { mutation, query } from './_generated/server';

import { Id } from './_generated/dataModel';
import { v } from 'convex/values';

export const getShops = query({
  args: {},
  handler: async (ctx) => {
    const shops = await ctx.db.query('shops').collect();

    return await Promise.all(
      shops.map(async (shop) => {
        let logoUrl = null as string | null;

        if (shop.logoUrl?.includes('data:image')) {
          logoUrl = shop.logoUrl;
        } else {
          logoUrl = await ctx.storage.getUrl(shop.logoUrl as Id<'_storage'>);
        }

        return {
          ...shop,
          logoUrl,
        };
      }),
    );
  },
});

export const listShops = query({
  handler: async (ctx) => {
    return ctx.db.query('shops').collect();
  },
});

export const getShop = query({
  args: { id: v.id('shops') },
  handler: async (ctx, args) => {
    const shop = await ctx.db.get(args.id);

    if (!shop) {
      throw new Error('Shop not found');
    }

    let logoUrl = null as string | null;

    if (shop.logoUrl?.includes('data:image')) {
      logoUrl = shop.logoUrl;
    } else {
      logoUrl = await ctx.storage.getUrl(shop.logoUrl as Id<'_storage'>);
    }

    return {
      ...shop,
      logoUrl,
    };
  },
});

export const getShopByShopId = query({
  args: { shopId: v.string() },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query('shops')
      .filter((q) => q.eq(q.field('shopId'), args.shopId))
      .first();

    if (!shop) {
      throw new Error('Shop not found');
    }

    let logoUrl = null as string | null;

    if (shop.logoUrl?.includes('data:image')) {
      logoUrl = shop.logoUrl;
    } else {
      logoUrl = await ctx.storage.getUrl(shop.logoUrl as Id<'_storage'>);
    }

    return {
      ...shop,
      logoUrl,
    };
  },
});

export const createShop = mutation({
  args: {
    owner: v.string(),
    name: v.string(),
    logo: v.optional(v.id('_storage')),
    logoUrl: v.optional(v.string()),
    location: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    inventoryMode: v.optional(v.union(v.literal('barcode'), v.literal('quantity'))),
  },
  handler: async (ctx, args) => {
    let shopId: string;
    let isUnique = false;

    while (!isUnique) {
      const namePrefix = args.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      shopId = `${namePrefix}-${randomSuffix}`;

      const existingShop = await ctx.db
        .query('shops')
        .filter((q) => q.eq(q.field('shopId'), shopId))
        .first();

      if (!existingShop) {
        isUnique = true;
      }
    }

    const hashedPassword = await hashPassword(shopId!.split('-')[1]);

    return await ctx.db.insert('shops', {
      ...args,
      shopId: shopId!,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateShop = mutation({
  args: {
    id: v.id('shops'),
    shopId: v.optional(v.string()),
    owner: v.optional(v.string()),
    name: v.optional(v.string()),
    logo: v.optional(v.id('_storage')),
    logoUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    inventoryMode: v.optional(v.union(v.literal('barcode'), v.literal('quantity'))),
    loginAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    if (updates.shopId) {
      const existingShop = await ctx.db
        .query('shops')
        .filter((q) => q.eq(q.field('shopId'), updates.shopId))
        .first();

      if (existingShop && existingShop._id !== id) {
        throw new Error('Shop ID already exists');
      }
    }

    return await ctx.db.patch(id, updates);
  },
});

export const deleteShop = mutation({
  args: { id: v.id('shops') },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const authenticateShop = mutation({
  args: {
    shopId: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query('shops')
      .filter((q) => q.eq(q.field('shopId'), args.shopId))
      .first();

    if (!shop) {
      throw new Error('Shop not found');
    }

    const isValidPassword = await verifyPassword(args.password, shop.password);

    if (!isValidPassword) {
      throw new Error('Invalid Password');
    }

    if (shop.loginAt) {
      throw new Error('Shop already logged in. Please contact the developer for further instructions');
    }

    let logoUrl = null as string | null;

    if (shop.logoUrl?.includes('data:image')) {
      logoUrl = shop.logoUrl;
    } else {
      logoUrl = await ctx.storage.getUrl(shop.logoUrl as Id<'_storage'>);
    }

    await ctx.db.patch(shop._id, {
      loginAt: new Date().toISOString(),
    });

    return {
      id: shop._id,
      shopId: shop.shopId,
      name: shop.name,
      owner: shop.owner,
      logo: shop.logoUrl,
      location: shop.location,
      phone: shop.phone,
      email: shop.email,
      description: shop.description,
      theme: shop.theme,
      inventoryMode: shop.inventoryMode,
    };
  },
});
