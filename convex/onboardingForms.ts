import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const hoursValidator = v.array(
  v.object({
    day: v.string(),
    isOpen: v.boolean(),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
  }),
);

const servicesValidator = v.array(v.object({ name: v.string() }));
const pricesValidator = v.optional(
  v.array(v.object({ serviceName: v.string(), price: v.string() })),
);
const staffContactsValidator = v.array(
  v.object({ name: v.string(), phoneNumber: v.string() }),
);

export const submit = mutation({
  args: {
    businessName: v.string(),
    ownerFullName: v.string(),
    shopPhoneNumber: v.string(),
    shopAddress: v.string(),
    businessEmail: v.string(),
    websiteUrl: v.optional(v.string()),
    hours: hoursValidator,
    services: servicesValidator,
    mentionPrices: v.boolean(),
    prices: pricesValidator,
    numberOfChairs: v.number(),
    barberNames: v.array(v.string()),
    staffContacts: staffContactsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("onboardingForms", {
      ...args,
      submittedAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("onboardingForms")
      .withIndex("by_submittedAt")
      .order("desc")
      .take(100);
  },
});

export const getById = query({
  args: { id: v.id("onboardingForms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
