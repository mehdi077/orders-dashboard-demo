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
