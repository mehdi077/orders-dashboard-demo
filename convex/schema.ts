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
    chairs: v.number(),
    startHour: v.number(),
    endHour: v.number(),
    slotMinutes: v.number(),
  }),

  barberAppointments: defineTable({
    dayKey: v.string(), // e.g. "2026-04-24" in the user's local calendar
    startTime: v.number(), // epoch ms
    endTime: v.number(), // epoch ms
    clientName: v.string(),
    phoneNumber: v.optional(v.string()),
    service: v.optional(v.string()),
    notes: v.optional(v.string()),
    chair: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("cancelled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dayKey_and_status_and_startTime", ["dayKey", "status", "startTime"])
    .index("by_status_and_startTime", ["status", "startTime"]),

  // PIN for app access (single-row table)
  appPin: defineTable({
    pin: v.string(),
  }),

  // Onboarding form submissions
  onboardingForms: defineTable({
    // Section 1: Basic Business Info
    businessName: v.string(),
    ownerFullName: v.string(),
    shopPhoneNumber: v.string(),
    shopAddress: v.string(),
    businessEmail: v.string(),
    websiteUrl: v.optional(v.string()),
    // Section 2: Hours & Availability
    hours: v.array(v.object({
      day: v.string(),
      isOpen: v.boolean(),
      openTime: v.optional(v.string()),
      closeTime: v.optional(v.string()),
    })),
    // Section 3: Services & Pricing
    services: v.array(v.object({
      name: v.string(),
    })),
    mentionPrices: v.boolean(),
    prices: v.optional(v.array(v.object({
      serviceName: v.string(),
      price: v.string(),
    }))),
    // Section 4: Staff & Barbers
    numberOfChairs: v.number(),
    barberNames: v.array(v.string()),
    // Section 5: Call Transfers
    staffContacts: v.array(v.object({
      name: v.string(),
      phoneNumber: v.string(),
    })),
    submittedAt: v.number(),
  }).index("by_submittedAt", ["submittedAt"]),
});
