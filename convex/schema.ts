import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    customerName: v.string(),
    items: v.string(),
    quantity: v.number(),
    specialInstructions: v.optional(v.string()),
    phoneNumber: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status_createdAt", ["status", "createdAt"]),
});
