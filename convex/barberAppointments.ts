import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertValidDurationMinutes(durationMinutes: number) {
  if (!Number.isFinite(durationMinutes)) {
    throw new Error("Invalid duration.");
  }
  if (durationMinutes < 10 || durationMinutes > 8 * 60) {
    throw new Error("Duration must be between 10 minutes and 8 hours.");
  }
}

function assertValidTimes(startTime: number, endTime: number) {
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    throw new Error("Invalid time.");
  }
  if (endTime <= startTime) {
    throw new Error("End time must be after start time.");
  }
}

function overlaps(
  a: { startTime: number; endTime: number },
  b: { startTime: number; endTime: number },
) {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

export const listScheduledInRange = query({
  args: { startTime: v.number(), endTime: v.number() },
  handler: async (ctx, args) => {
    const start = args.startTime;
    const end = args.endTime;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return [];
    }

    return await ctx.db
      .query("barberAppointments")
      .withIndex("by_status_and_startTime", (q) =>
        q.eq("status", "scheduled").gte("startTime", start).lt("startTime", end),
      )
      .order("asc")
      .take(1000);
  },
});

export const listScheduledForDay = query({
  args: { dayKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("barberAppointments")
      .withIndex("by_dayKey_and_status_and_startTime", (q) =>
        q.eq("dayKey", args.dayKey).eq("status", "scheduled"),
      )
      .order("asc")
      .take(500);
  },
});

export const getById = query({
  args: { id: v.id("barberAppointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const findByPhoneNumber = query({
  args: { phoneNumber: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 50));
    const recent = await ctx.db
      .query("barberAppointments")
      .withIndex("by_status_and_startTime", (q) => q.eq("status", "scheduled"))
      .order("desc")
      .take(500);
    return recent.filter((a) => a.phoneNumber === args.phoneNumber).slice(0, limit);
  },
});

export const create = mutation({
  args: {
    dayKey: v.string(),
    clientName: v.string(),
    phoneNumber: v.string(),
    service: v.optional(v.string()),
    notes: v.optional(v.string()),
    startTime: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    assertValidDurationMinutes(args.durationMinutes);

    const now = Date.now();
    const endTime = args.startTime + args.durationMinutes * 60_000;
    assertValidTimes(args.startTime, endTime);

    const existing = await ctx.db
      .query("barberAppointments")
      .withIndex("by_dayKey_and_status_and_startTime", (q) =>
        q.eq("dayKey", args.dayKey).eq("status", "scheduled"),
      )
      .order("asc")
      .take(200);

    for (const appt of existing) {
      if (overlaps({ startTime: args.startTime, endTime }, appt)) {
        throw new Error("This time overlaps another appointment.");
      }
    }

    return await ctx.db.insert("barberAppointments", {
      dayKey: args.dayKey,
      startTime: args.startTime,
      endTime,
      clientName: args.clientName,
      phoneNumber: args.phoneNumber,
      service: args.service,
      notes: args.notes,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("barberAppointments"),
    dayKey: v.string(),
    clientName: v.string(),
    phoneNumber: v.string(),
    service: v.optional(v.string()),
    notes: v.optional(v.string()),
    startTime: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id);
    if (!current) {
      throw new Error("Appointment not found.");
    }
    if (current.status === "cancelled") {
      throw new Error("Cancelled appointments can't be edited.");
    }

    assertValidDurationMinutes(args.durationMinutes);
    const endTime = args.startTime + args.durationMinutes * 60_000;
    assertValidTimes(args.startTime, endTime);

    const existing = await ctx.db
      .query("barberAppointments")
      .withIndex("by_dayKey_and_status_and_startTime", (q) =>
        q.eq("dayKey", args.dayKey).eq("status", "scheduled"),
      )
      .order("asc")
      .take(200);

    for (const appt of existing) {
      if (appt._id === args.id) continue;
      if (overlaps({ startTime: args.startTime, endTime }, appt)) {
        throw new Error("This time overlaps another appointment.");
      }
    }

    await ctx.db.patch(args.id, {
      dayKey: args.dayKey,
      startTime: args.startTime,
      endTime,
      clientName: args.clientName,
      phoneNumber: args.phoneNumber,
      service: args.service,
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("barberAppointments") },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id);
    if (!current) return null;
    if (current.status === "cancelled") return null;
    await ctx.db.patch(args.id, { status: "cancelled", updatedAt: Date.now() });
    return null;
  },
});
