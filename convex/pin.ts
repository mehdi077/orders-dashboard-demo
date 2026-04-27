import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_PIN = "130501";

export const getPin = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("appPin").take(1);
    return rows[0]?.pin ?? DEFAULT_PIN;
  },
});

export const setPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    if (!/^\d{6}$/.test(args.pin)) {
      throw new Error("PIN must be exactly 6 digits.");
    }
    const existing = await ctx.db.query("appPin").take(1);
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { pin: args.pin });
    } else {
      await ctx.db.insert("appPin", { pin: args.pin });
    }
  },
});

export const verifyPin = query({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("appPin").take(1);
    const currentPin = rows.length > 0 ? rows[0].pin : DEFAULT_PIN;
    return { valid: currentPin === args.pin };
  },
});

export const isPinSet = query({
  args: {},
  handler: async () => {
    // Default PIN is always available, so always require authentication
    return true;
  },
});
