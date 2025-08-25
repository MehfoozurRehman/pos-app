import { defineSchema, defineTable } from 'convex/server';

import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
  }).index('by_email', ['email']),
  shops: defineTable({
    shopId: v.string(),
    owner: v.string(),
    name: v.string(),
    logo: v.string(),
    location: v.string(),
    password: v.string(),
    lastLogin: v.optional(v.string()),
  }),
  payments: defineTable({
    shop: v.id('shops'),
    month: v.string(),
    year: v.string(),
  }),
  products: defineTable({
    shop: v.id('shops'),
    name: v.string(),
    description: v.string(),
    categories: v.array(v.string()),
    picture: v.string(),
  }),
  inventory: defineTable({
    product: v.id('products'),
    barcode: v.string(),
    actualPrice: v.number(),
    sellingPrice: v.number(),
  }),
  orders: defineTable({
    orderId: v.string(),
    shop: v.id('shops'),
    status: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(
      v.object({
        product: v.id('products'),
        barcode: v.string(),
        discount: v.optional(v.number()),
      }),
    ),
    discount: v.optional(v.number()),
  }),
});
