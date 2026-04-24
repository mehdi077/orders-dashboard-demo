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
    const DEFAULT_BARBER_HOURS = {
      startHour: 8,
      endHour: 20,
      slotMinutes: 30,
    } as const;

    const dateSchema = z
      .string()
      .regex(DATE_RE, "Must be a calendar date in YYYY-MM-DD format.");
    const timeSchema = z
      .string()
      .regex(TIME_RE, "Must be a 24-hour time in HH:MM format.");

    function dateTimeToTimestamp(date: string, time: string): number {
      const [y, m, d] = date.split("-").map(Number);
      const [hh, mm] = time.split(":").map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0).getTime();
    }

    function timestampToTime(ms: number): string {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    function overlaps(
      a: { startTime: number; endTime: number },
      b: { startTime: number; endTime: number },
    ) {
      return a.startTime < b.endTime && a.endTime > b.startTime;
    }

    server.tool(
      "barber_list_day_appointments",
      "List all scheduled barber appointments for a given calendar date (YYYY-MM-DD), sorted by start time.",
      {
        date: dateSchema.describe("The day to list, in YYYY-MM-DD format."),
      },
      async ({ date }) => {
        const convex = getConvexClient();
        const appts = await convex.query(
          api.barberAppointments.listScheduledForDay,
          { dayKey: date },
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { dayKey: date, count: appts.length, appointments: appts },
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
      "Find scheduled barber appointments for a given phone number (exact string match).",
      {
        phoneNumber: z
          .string()
          .min(1)
          .describe("The client's phone number, exactly as it was stored."),
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
        const results = await convex.query(
          api.barberAppointments.findByPhoneNumber,
          { phoneNumber, limit },
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
      "Book a new barber appointment. Rejects if the time overlaps an existing scheduled appointment on that day. Phone number is required.",
      {
        date: dateSchema.describe("Day to book, in YYYY-MM-DD format."),
        time: timeSchema.describe("Start time, 24-hour HH:MM (e.g. '14:30')."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Appointment length in minutes (10-480)."),
        clientName: z.string().min(1).describe("Client's full name."),
        phoneNumber: z
          .string()
          .min(1)
          .describe("Client's phone number. Required."),
        service: z
          .string()
          .optional()
          .describe("Optional service label, e.g. 'Fade + Beard'."),
        notes: z.string().optional().describe("Optional free-form notes."),
      },
      async ({
        date,
        time,
        durationMinutes,
        clientName,
        phoneNumber,
        service,
        notes,
      }) => {
        const convex = getConvexClient();
        const startTime = dateTimeToTimestamp(date, time);
        const trimmedService = service?.trim();
        const trimmedNotes = notes?.trim();
        const id = await convex.mutation(api.barberAppointments.create, {
          dayKey: date,
          startTime,
          durationMinutes,
          clientName: clientName.trim(),
          phoneNumber: phoneNumber.trim(),
          service:
            trimmedService && trimmedService.length > 0 ? trimmedService : undefined,
          notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
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
      "Reschedule or edit an existing barber appointment. Supply the id plus the full set of fields you want the appointment to end up with. Overlap validation is applied, excluding the appointment itself.",
      {
        id: z.string().min(1).describe("The appointment's Convex id."),
        date: dateSchema.describe("Day for the updated appointment, YYYY-MM-DD."),
        time: timeSchema.describe("Updated start time, HH:MM (24-hour)."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Updated duration in minutes."),
        clientName: z.string().min(1).describe("Client's full name."),
        phoneNumber: z.string().min(1).describe("Client's phone number. Required."),
        service: z.string().optional().describe("Optional service label."),
        notes: z.string().optional().describe("Optional free-form notes."),
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
      }) => {
        const convex = getConvexClient();
        const startTime = dateTimeToTimestamp(date, time);
        const trimmedService = service?.trim();
        const trimmedNotes = notes?.trim();
        await convex.mutation(api.barberAppointments.update, {
          id: id as Id<"barberAppointments">,
          dayKey: date,
          startTime,
          durationMinutes,
          clientName: clientName.trim(),
          phoneNumber: phoneNumber.trim(),
          service:
            trimmedService && trimmedService.length > 0 ? trimmedService : undefined,
          notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : undefined,
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
      "barber_next_available_slot",
      "Find the first free time slot on a given date that fits the requested duration, respecting the shop's business hours and existing appointments.",
      {
        date: dateSchema.describe("Day to search, in YYYY-MM-DD format."),
        durationMinutes: z
          .number()
          .int()
          .min(10)
          .max(480)
          .describe("Length of the appointment to fit, in minutes."),
        earliestTime: timeSchema
          .optional()
          .describe(
            "Optional earliest start time HH:MM (e.g. '10:00'). Defaults to business opening.",
          ),
      },
      async ({ date, durationMinutes, earliestTime }) => {
        const convex = getConvexClient();
        const appts = await convex.query(
          api.barberAppointments.listScheduledForDay,
          { dayKey: date },
        );

        const { startHour, endHour, slotMinutes } = DEFAULT_BARBER_HOURS;
        const openMs = dateTimeToTimestamp(
          date,
          `${String(startHour).padStart(2, "0")}:00`,
        );
        const closeMs = dateTimeToTimestamp(
          date,
          `${String(endHour).padStart(2, "0")}:00`,
        );
        const floor = earliestTime
          ? Math.max(openMs, dateTimeToTimestamp(date, earliestTime))
          : openMs;
        const durationMs = durationMinutes * 60_000;
        const stepMs = slotMinutes * 60_000;

        for (let t = floor; t + durationMs <= closeMs; t += stepMs) {
          const slotEnd = t + durationMs;
          const conflict = appts.some((a) =>
            overlaps({ startTime: t, endTime: slotEnd }, a),
          );
          if (!conflict) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      ok: true,
                      dayKey: date,
                      time: timestampToTime(t),
                      startTime: t,
                      durationMinutes,
                      businessHours: DEFAULT_BARBER_HOURS,
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
                  dayKey: date,
                  error: "No slot available for that duration on this date.",
                  businessHours: DEFAULT_BARBER_HOURS,
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
      "Read the barber shop's default business hours. These are the hours the scheduler and availability tools use.",
      {},
      async () => {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  startHour: DEFAULT_BARBER_HOURS.startHour,
                  endHour: DEFAULT_BARBER_HOURS.endHour,
                  slotMinutes: DEFAULT_BARBER_HOURS.slotMinutes,
                  description: `Open ${DEFAULT_BARBER_HOURS.startHour}:00 to ${DEFAULT_BARBER_HOURS.endHour}:00 with ${DEFAULT_BARBER_HOURS.slotMinutes}-minute booking slots.`,
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
