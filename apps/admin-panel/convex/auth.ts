import { hashPassword, verifyPassword } from '@/utils/encryption';

import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const createAdmin = mutation({
  args: { name: v.string(), email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const { name, email, password } = args;

    const hashedPassword = await hashPassword(password);

    const adminId = await ctx.db.insert('users', { name, email, password: hashedPassword });

    return adminId;
  },
});

export const loginAdmin = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const { email, password } = args;

    if (!email) {
      throw new Error('Email is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email')
      .filter((q) => q.eq(q.field('email'), email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      throw new Error('Invalid password');
    }

    return user._id;
  },
});

export const validateUser = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const { id } = args;

    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('_id'), id))
      .first();

    if (!user) {
      return null;
    }

    return user._id;
  },
});
