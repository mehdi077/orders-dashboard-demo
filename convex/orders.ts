import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
  },
});

export const listCompleted = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "completed"))
      .order("desc")
      .collect();
  },
});

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    items: v.string(),
    quantity: v.number(),
    specialInstructions: v.optional(v.string()),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("orders", {
      customerName: args.customerName,
      items: args.items,
      quantity: args.quantity,
      specialInstructions: args.specialInstructions,
      phoneNumber: args.phoneNumber,
      status: "active",
      createdAt: now,
    });
  },
});

export const markCompleted = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});
