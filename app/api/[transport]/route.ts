import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "../_lib/convex";
import { requireApiKey } from "../_lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const mcpHandler = createMcpHandler(
  (server) => {
    server.tool(
      "list_active_orders",
      "List all active (not yet completed) kitchen orders, newest first. Mirrors the main dashboard view.",
      {},
      async () => {
        const convex = getConvexClient();
        const orders = await convex.query(api.orders.listActive, {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "active", count: orders.length, orders }, null, 2),
            },
          ],
        };
      },
    );

    server.tool(
      "list_completed_orders",
      "List all completed kitchen orders, newest first. Mirrors the /completed page.",
      {},
      async () => {
        const convex = getConvexClient();
        const orders = await convex.query(api.orders.listCompleted, {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "completed", count: orders.length, orders }, null, 2),
            },
          ],
        };
      },
    );

    server.tool(
      "create_order",
      "Create a new active kitchen order. Mirrors the New Order modal in the UI.",
      {
        customerName: z.string().min(1).describe("Customer name, e.g. 'Jane Doe'."),
        items: z
          .string()
          .min(1)
          .describe("Free-text order items, e.g. '2x Margherita Pizza, 1x Caesar Salad'."),
        quantity: z
          .number()
          .int()
          .min(1)
          .describe("Total item quantity, must be an integer >= 1."),
        phoneNumber: z.string().min(1).describe("Customer phone number."),
        specialInstructions: z
          .string()
          .optional()
          .describe("Optional special instructions, e.g. 'No onions, extra spicy'."),
      },
      async ({ customerName, items, quantity, phoneNumber, specialInstructions }) => {
        const convex = getConvexClient();
        const trimmedInstructions = specialInstructions?.trim();
        const id = await convex.mutation(api.orders.createOrder, {
          customerName: customerName.trim(),
          items: items.trim(),
          quantity,
          phoneNumber: phoneNumber.trim(),
          specialInstructions:
            trimmedInstructions && trimmedInstructions.length > 0 ? trimmedInstructions : undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  id,
                  status: "active",
                  customerName: customerName.trim(),
                  items: items.trim(),
                  quantity,
                  phoneNumber: phoneNumber.trim(),
                  specialInstructions:
                    trimmedInstructions && trimmedInstructions.length > 0
                      ? trimmedInstructions
                      : null,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "mark_order_completed",
      "Mark an active order as completed. Mirrors the 'Mark Completed' button on each order card.",
      {
        id: z
          .string()
          .min(1)
          .describe("The order's Convex id (the `_id` field returned by list_active_orders)."),
      },
      async ({ id }) => {
        const convex = getConvexClient();
        await convex.mutation(api.orders.markCompleted, {
          id: id as Id<"orders">,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, id, status: "completed" }, null, 2),
            },
          ],
        };
      },
    );

    // ------------------------------------------------------------------
    // Barber-demo tools
    // ------------------------------------------------------------------

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
    const FALLBACK_BARBER_HOURS = {
      startHour: 8,
      endHour: 20,
      slotMinutes: 30,
    } as const;

    // Normalize phone: strip non-digits
    function normalizePhone(phone: string): string {
      return phone.replace(/\D/g, "");
    }

    // Normalize date: handle Y-M-D or YYYY-M-D formats
    function normalizeDate(date: string): string {
      const parts = date.split("-").map((n) => parseInt(n, 10));
      if (parts.length !== 3) throw new Error("Invalid date format.");
      const [y, m, d] = parts;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }

    // Normalize time: handle H:MM or HH:M formats
    function normalizeTime(time: string): string {
      const parts = time.split(":").map((n) => parseInt(n, 10));
      if (parts.length !== 2) throw new Error("Invalid time format.");
      const [hh, mm] = parts;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }

    const dateSchema = z
      .string()
      .min(1)
      .describe("Calendar date in YYYY-MM-DD format (e.g., '2026-04-28').");

    const timeSchema = z
      .string()
      .min(1)
      .describe("Time in HH:MM 24-hour format in New York / Eastern Time (e.g., '14:30' for 2:30 PM ET).");

    const phoneNumberSchema = z
      .string()
      .min(7)
      .describe("Phone number (digits only, no + or dashes).");

    // Convert NY time (Eastern Time) to UTC timestamp
    // Server runs in America/New_York (EDT, UTC-4)
    // Agent sends "2 PM" = 2 PM NY time = 6 PM UTC
    function dateTimeToTimestamp(date: string, time: string): number {
      const [y, m, d] = date.split("-").map(Number);
      const [hh, mm] = time.split(":").map(Number);
      // Add 4 hours to convert NY time to UTC (EDT = UTC-4)
      return Date.UTC(y, (m ?? 1) - 1, d ?? 1, (hh ?? 0) + 4, mm ?? 0, 0, 0);
    }

    // Convert UTC timestamp to Eastern Time (New York) for display
    function timestampToTime(ms: number): string {
      // Use Intl to convert UTC to America/New_York timezone
      const date = new Date(ms);
      const nyTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
      return nyTime;
    }

    function overlaps(
      a: { startTime: number; endTime: number },
      b: { startTime: number; endTime: number },
    ) {
      return a.startTime < b.endTime && a.endTime > b.startTime;
    }

    server.tool(
      "barber_list_day_appointments",
      "List all scheduled barber appointments for a given calendar date (YYYY-MM-DD), sorted by start time. Each appointment includes a 'chair' field indicating which chair it is booked on. Call barber_get_business_hours first to learn the total number of chairs.",
      {
        date: dateSchema.describe("The day to list, in YYYY-MM-DD format."),
      },
      async ({ date }) => {
        const convex = getConvexClient();
        const normalizedDate = normalizeDate(date);
        const appts = await convex.query(
          api.barberAppointments.listScheduledForDay,
          { dayKey: normalizedDate },
        );
        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const chairs = settings?.chairs ?? 1;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { dayKey: date, chairs, count: appts.length, appointments: appts },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_find_appointments_by_phone",
      "Find scheduled barber appointments for a given phone number (digits-only match).",
      {
        phoneNumber: z
          .string()
          .min(7)
          .describe("The client's phone number (digits only, no + or dashes)."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Max number of results to return. Defaults to 50."),
      },
      async ({ phoneNumber, limit }) => {
        const convex = getConvexClient();
        const normalizedPhone = normalizePhone(phoneNumber);
        const results = await convex.query(
          api.barberAppointments.findByPhoneNumber,
          { phoneNumber: normalizedPhone, limit },
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { phoneNumber, count: results.length, appointments: results },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_get_appointment",
      "Fetch a single barber appointment by its Convex id.",
      {
        id: z.string().min(1).describe("The appointment's Convex id."),
      },
      async ({ id }) => {
        const convex = getConvexClient();
        const appt = await convex.query(api.barberAppointments.getById, {
          id: id as Id<"barberAppointments">,
        });
        if (!appt) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ ok: false, error: "Not found", id }, null, 2),
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, appointment: appt }, null, 2),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_create_appointment",
      "Book a new barber appointment. The shop has multiple chairs — each chair has an independent schedule, so two appointments can overlap if they are on different chairs. IMPORTANT: Before booking, use barber_check_availability to see which chairs are free at the desired time, or barber_next_available_slot to find the earliest open slot. If you don't specify a chair, it defaults to chair 1. Call barber_get_business_hours to learn the total number of chairs. Times are in New York / Eastern Time. Rejects if the time overlaps an existing appointment on the same chair. Phone number is required.",
      {
        date: dateSchema.describe("Day to book, in YYYY-MM-DD format. Accepts Y-M-D or YYYY-M-D formats."),
        time: timeSchema.describe("Start time in New York / Eastern Time, 24-hour HH:MM (e.g. '14:30'). Accepts H:MM or HH:M formats."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Appointment length in minutes (10-480)."),
        clientName: z.string().min(1).describe("Client's full name."),
        phoneNumber: phoneNumberSchema,
        service: z
          .string()
          .optional()
          .describe("Optional service label, e.g. 'Fade + Beard'."),
        notes: z.string().optional().describe("Optional free-form notes."),
        chair: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Chair number to book (1 to total chairs). Defaults to chair 1 if omitted. Call barber_get_business_hours to learn the valid range."),
      },
      async ({
        date,
        time,
        durationMinutes,
        clientName,
        phoneNumber,
        service,
        notes,
        chair,
      }) => {
        const convex = getConvexClient();
        const normalizedDate = normalizeDate(date);
        const normalizedTime = normalizeTime(time);
        const normalizedPhone = normalizePhone(phoneNumber);
        if (normalizedPhone.length < 7) {
          throw new Error("Phone number must have at least 7 digits.");
        }
        const startTime = dateTimeToTimestamp(normalizedDate, normalizedTime);
        const trimmedService = service?.trim();
        const trimmedNotes = notes?.trim();
        
        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const maxChairs = settings ? settings.chairs : 1;
        const chairNum = chair ?? 1;
        if (chairNum < 1 || chairNum > maxChairs) {
          throw new Error(`Chair must be between 1 and ${maxChairs}.`);
        }
        
        const id = await convex.mutation(api.barberAppointments.create, {
          dayKey: normalizedDate,
          startTime,
          durationMinutes,
          clientName: clientName.trim(),
          phoneNumber: normalizedPhone,
          service:
            trimmedService && trimmedService.length > 0 ? trimmedService : undefined,
          notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
          chair: chairNum,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  id,
                  dayKey: date,
                  time,
                  durationMinutes,
                  clientName: clientName.trim(),
                  phoneNumber: phoneNumber.trim(),
                  chair: chairNum,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_update_appointment",
      "Reschedule or edit an existing barber appointment. Supply the id plus the full set of fields you want the appointment to end up with. If chair is omitted, the appointment keeps its current chair. Overlap validation is applied on the target chair, excluding the appointment itself. Times are in New York / Eastern Time.",
      {
        id: z.string().min(1).describe("The appointment's Convex id."),
        date: dateSchema.describe("Day for the updated appointment, YYYY-MM-DD."),
        time: timeSchema.describe("Updated start time in New York / Eastern Time, HH:MM (24-hour)."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Updated duration in minutes."),
        clientName: z.string().min(1).describe("Client's full name."),
        phoneNumber: phoneNumberSchema,
        service: z.string().optional().describe("Optional service label."),
        notes: z.string().optional().describe("Optional free-form notes."),
        chair: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Chair number (1 to total chairs). If omitted, keeps the appointment's current chair."),
      },
      async ({
        id,
        date,
        time,
        durationMinutes,
        clientName,
        phoneNumber,
        service,
        notes,
        chair,
      }) => {
        const convex = getConvexClient();
        const normalizedDate = normalizeDate(date);
        const normalizedTime = normalizeTime(time);
        const normalizedPhone = normalizePhone(phoneNumber);
        if (normalizedPhone.length < 7) {
          throw new Error("Phone number must have at least 7 digits.");
        }
        const startTime = dateTimeToTimestamp(normalizedDate, normalizedTime);
        const trimmedService = service?.trim();
        const trimmedNotes = notes?.trim();
        
        // Fetch current appointment to preserve chair if not specified
        const current = await convex.query(api.barberAppointments.getById, {
          id: id as Id<"barberAppointments">,
        });
        if (!current) {
          throw new Error("Appointment not found.");
        }
        const chairNum = chair ?? (current.chair ?? 1);
        
        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const maxChairs = settings ? settings.chairs : 1;
        if (chairNum < 1 || chairNum > maxChairs) {
          throw new Error(`Chair must be between 1 and ${maxChairs}.`);
        }
        
        await convex.mutation(api.barberAppointments.update, {
          id: id as Id<"barberAppointments">,
          dayKey: normalizedDate,
          startTime,
          durationMinutes,
          clientName: clientName.trim(),
          phoneNumber: normalizedPhone,
          service:
            trimmedService && trimmedService.length > 0 ? trimmedService : undefined,
          notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
          chair: chairNum,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  id,
                  dayKey: normalizedDate,
                  time: normalizedTime,
                  durationMinutes,
                  clientName: clientName.trim(),
                  phoneNumber: normalizedPhone,
                  chair: chairNum,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_cancel_appointment",
      "Cancel a scheduled barber appointment. The record stays in Convex with status='cancelled'.",
      {
        id: z.string().min(1).describe("The appointment's Convex id."),
      },
      async ({ id }) => {
        const convex = getConvexClient();
        await convex.mutation(api.barberAppointments.cancel, {
          id: id as Id<"barberAppointments">,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, id, status: "cancelled" }, null, 2),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_check_availability",
      "Check which chairs are free or booked at a specific date, time, and duration. Returns a per-chair breakdown showing availability and any conflicting appointment. Use this when a customer requests a specific time and you need to know which chair to book, or when a customer wants a specific chair and you need to confirm it's free. Times are in New York / Eastern Time.",
      {
        date: dateSchema.describe("Date to check, in YYYY-MM-DD format."),
        time: timeSchema.describe("Start time in New York / Eastern Time, 24-hour HH:MM (e.g. '14:30')."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Appointment length in minutes (10-480)."),
      },
      async ({ date, time, durationMinutes }) => {
        const convex = getConvexClient();
        const normalizedDate = normalizeDate(date);
        const normalizedTime = normalizeTime(time);
        const startTime = dateTimeToTimestamp(normalizedDate, normalizedTime);
        const endTime = startTime + durationMinutes * 60_000;

        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const totalChairs = settings?.chairs ?? 1;
        const startHour = settings?.startHour ?? FALLBACK_BARBER_HOURS.startHour;
        const endHour = settings?.endHour ?? FALLBACK_BARBER_HOURS.endHour;

        // Validate time is within business hours
        const openMs = dateTimeToTimestamp(normalizedDate, `${String(startHour).padStart(2, "0")}:00`);
        const closeMs = dateTimeToTimestamp(normalizedDate, `${String(endHour).padStart(2, "0")}:00`);
        if (startTime < openMs || endTime > closeMs) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    ok: false,
                    error: `Requested time is outside business hours (${startHour}:00–${endHour}:00 ET).`,
                    businessHours: { startHour, endHour },
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const appts = await convex.query(
          api.barberAppointments.listScheduledForDay,
          { dayKey: normalizedDate },
        );

        const chairStatus = Array.from({ length: totalChairs }, (_, i) => {
          const chairNum = i + 1;
          const conflict = appts.find(
            (a) => (a.chair ?? 1) === chairNum && overlaps({ startTime, endTime }, a),
          );
          return {
            chair: chairNum,
            available: !conflict,
            conflict: conflict
              ? { id: conflict._id, clientName: conflict.clientName, startTime: conflict.startTime, endTime: conflict.endTime }
              : null,
          };
        });

        const availableChairs = chairStatus.filter((c) => c.available).map((c) => c.chair);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  dayKey: normalizedDate,
                  time: normalizedTime,
                  durationMinutes,
                  totalChairs,
                  availableChairs,
                  chairs: chairStatus,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_next_available_slot",
      "Find the earliest free time slot on a given date that fits the requested duration, across all chairs. Only returns the first matching slot — use barber_check_availability instead when you need to see all available chairs at a specific time. Returns the time, chair number, and business hours. Use the returned 'chair' value when calling barber_create_appointment.",
      {
        date: dateSchema.describe("Day to search, in YYYY-MM-DD format. Accepts Y-M-D or YYYY-M-D formats."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Length of the appointment to fit, in minutes."),
        earliestTime: timeSchema
          .optional()
          .describe(
            "Optional earliest start time HH:MM (e.g. '10:00'). Accepts H:MM or HH:M formats. Defaults to business opening.",
          ),
      },
      async ({ date, durationMinutes, earliestTime }) => {
        const convex = getConvexClient();
        const normalizedDate = normalizeDate(date);
        const normalizedEarliestTime = earliestTime ? normalizeTime(earliestTime) : earliestTime;
        const appts = await convex.query(
          api.barberAppointments.listScheduledForDay,
          { dayKey: normalizedDate },
        );

        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const bh = {
          startHour: settings?.startHour ?? FALLBACK_BARBER_HOURS.startHour,
          endHour: settings?.endHour ?? FALLBACK_BARBER_HOURS.endHour,
          slotMinutes: settings?.slotMinutes ?? FALLBACK_BARBER_HOURS.slotMinutes,
        };
        const { startHour, endHour, slotMinutes } = bh;
        const openMs = dateTimeToTimestamp(
          normalizedDate,
          `${String(startHour).padStart(2, "0")}:00`,
        );
        const closeMs = dateTimeToTimestamp(
          normalizedDate,
          `${String(endHour).padStart(2, "0")}:00`,
        );
        const floor = normalizedEarliestTime
          ? Math.max(openMs, dateTimeToTimestamp(normalizedDate, normalizedEarliestTime))
          : openMs;
        const durationMs = durationMinutes * 60_000;
        const stepMs = slotMinutes * 60_000;

        const chairs = settings?.chairs ?? 1;

        for (let t = floor; t + durationMs <= closeMs; t += stepMs) {
          const slotEnd = t + durationMs;
          // Find chairs that are busy during this slot
          const busyChairs = new Set(
            appts
              .filter((a) => overlaps({ startTime: t, endTime: slotEnd }, a))
              .map((a) => a.chair ?? 1),
          );
          const freeChair = Array.from({ length: chairs }, (_, i) => i + 1).find(
            (c) => !busyChairs.has(c),
          );
          if (freeChair) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      ok: true,
                      dayKey: normalizedDate,
                      time: timestampToTime(t),
                      startTime: t,
                      durationMinutes,
                      chair: freeChair,
                      businessHours: bh,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: false,
                  dayKey: normalizedDate,
                  error: "No slot available for that duration on this date.",
                  businessHours: bh,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "barber_get_business_hours",
      "Read the barber shop's full configuration: business hours (open/close), booking slot size, and total number of chairs. ALWAYS call this before booking to learn valid chair numbers (1 to chairs) and the shop's operating hours. Times are in New York / Eastern Time.",
      {},
      async () => {
        const convex = getConvexClient();
        const settings = await convex.query(api.barberAppointments.getBarberSettings, {});
        const sh = settings?.startHour ?? FALLBACK_BARBER_HOURS.startHour;
        const eh = settings?.endHour ?? FALLBACK_BARBER_HOURS.endHour;
        const sm = settings?.slotMinutes ?? FALLBACK_BARBER_HOURS.slotMinutes;
        const ch = settings?.chairs ?? 1;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  startHour: sh,
                  endHour: eh,
                  slotMinutes: sm,
                  chairs: ch,
                  description: `Open ${sh}:00 to ${eh}:00 with ${sm}-minute booking slots and ${ch} chair${ch !== 1 ? "s" : ""}.`,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  },
  {
    serverInfo: {
      name: "orders-dashboard-mcp",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
    disableSse: true,
    redisUrl: "",
  },
);

async function handler(request: Request): Promise<Response> {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  return mcpHandler(request);
}

export { handler as GET, handler as POST, handler as DELETE };
