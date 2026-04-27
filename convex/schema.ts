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

  // barberSettings: single row to store shop configuration
  barberSettings: defineTable({
    chairs: v.number().min(1).max(20),
    startHour: v.number().min(0).max(23),
    endHour: v.number().min(1).max(24),
    slotMinutes: v.number().min(5).max(120),
  }),

  barberAppointments: defineTable({
    dayKey: v.string(), // e.g. "2026-04-24" in the user's local calendar
    startTime: v.number(), // epoch ms
    endTime: v.number(), // epoch ms
    clientName: v.string(),
    phoneNumber: v.optional(v.string()),
    service: v.optional(v.string()),
    notes: v.optional(v.string()),
    chair: v.number().optional(),
    status: v.union(v.literal("scheduled"), v.literal("cancelled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dayKey_and_status_and_startTime", ["dayKey", "status", "startTime"])
    .index("by_status_and_startTime", ["status", "startTime"]),
});
