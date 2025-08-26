import { defineSchema, defineTable } from 'convex/server';

import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
  }).index('by_email', ['email']),
  notes: defineTable({
    shop: v.id('shops'),
    title: v.string(),
    content: v.string(),
    createdAt: v.string(),
  }),
  shops: defineTable({
    shopId: v.string(),
    owner: v.string(),
    name: v.string(),
    logo: v.string(),
    location: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    inventoryMode: v.optional(v.union(v.literal('barcode'), v.literal('quantity'))),
    password: v.string(),
    lastLogin: v.optional(v.string()),
    createdAt: v.optional(v.string()),
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
    pictureUrl: v.optional(v.string()),
    createdAt: v.string(),
  }),
  inventory: defineTable({
    product: v.id('products'),
    barcode: v.optional(v.string()),
    actualPrice: v.number(),
    sellingPrice: v.number(),
    quantity: v.optional(v.number()),
    createdAt: v.string(),
  }),
  orders: defineTable({
    orderId: v.string(),
    shop: v.id('shops'),
    status: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        barcode: v.optional(v.string()),
        inventoryId: v.optional(v.string()),
        discount: v.optional(v.number()),
        quantity: v.number(),
      }),
    ),
    discount: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }),
  logs: defineTable({
    shop: v.optional(v.id('shops')),
    level: v.union(v.literal('info'), v.literal('warn'), v.literal('error'), v.literal('debug')),
    message: v.string(),
    context: v.optional(v.string()),
    data: v.optional(v.any()),
    timestamp: v.string(),
    source: v.union(v.literal('main'), v.literal('renderer'), v.literal('admin')),
  }),
});
