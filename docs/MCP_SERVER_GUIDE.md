# Building an MCP Server for the Orders API

This guide describes how to build a standalone **Model Context Protocol
(MCP)** server that exposes the Orders HTTP API (see
`API_BLUEPRINT.md`) as MCP tools. The MCP server is intentionally **not**
part of this repository — you will build it on a separate machine /
repo and point it at this Next.js app's base URL.

The guide uses Node.js + TypeScript and the official
`@modelcontextprotocol/sdk`, but the same structure works in Python or
any other MCP SDK.

---

## 1. Prerequisites

- The orders-dashboard Next.js app is deployed (or running locally) and
  its base URL is reachable from wherever the MCP server will run.
- You have generated a shared secret and set it as `ORDERS_API_KEY` on
  the Next.js deployment.
- Node.js 20+ installed on the MCP server host.

Environment variables the MCP server will need:

| Variable           | Required | Description                                               |
| ------------------ | -------- | --------------------------------------------------------- |
| `ORDERS_API_URL`   | yes      | Base URL of this Next.js app (e.g. `https://orders.example.com`). |
| `ORDERS_API_KEY`   | yes      | Same shared secret configured on the Next.js app.         |

---

## 2. Suggested project layout

```
orders-mcp-server/
  package.json
  tsconfig.json
  src/
    index.ts          # entry point, boots the MCP server
    client.ts         # thin HTTP client against the Orders API
    tools/
      createOrder.ts
      listOrders.ts
      markCompleted.ts
```

---

## 3. `package.json`

```json
{
  "name": "orders-mcp-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "orders-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.4"
  }
}
```

## 4. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

---

## 5. HTTP client against the Orders API — `src/client.ts`

```ts
export type Order = {
  _id: string;
  _creationTime: number;
  customerName: string;
  items: string;
  quantity: number;
  specialInstructions?: string;
  phoneNumber: string;
  status: "active" | "completed";
  createdAt: number;
  completedAt?: number;
};

function baseUrl(): string {
  const url = process.env.ORDERS_API_URL;
  if (!url) throw new Error("ORDERS_API_URL is not set");
  return url.replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  const key = process.env.ORDERS_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orders API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const ordersApi = {
  createOrder(body: {
    customerName: string;
    items: string;
    quantity: number;
    specialInstructions?: string;
    phoneNumber: string;
  }) {
    return request<{ id: string; status: "active" }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listOrders(status: "active" | "completed") {
    return request<{ status: string; orders: Order[] }>(
      `/api/orders?status=${status}`,
    );
  },

  markCompleted(id: string) {
    return request<{ id: string; status: "completed" }>(
      `/api/orders/${encodeURIComponent(id)}/complete`,
      { method: "POST" },
    );
  },
};
```

---

## 6. Define MCP tools — `src/tools/*.ts`

Each tool wraps one endpoint with a Zod schema so the LLM gets precise
JSON schema / validation.

### `src/tools/createOrder.ts`

```ts
import { z } from "zod";
import { ordersApi } from "../client.js";

export const createOrderSchema = {
  name: "create_order",
  description:
    "Create a new active kitchen order. Returns the Convex document id.",
  inputSchema: {
    customerName: z.string().min(1).describe("Customer's display name"),
    items: z.string().min(1).describe("Human-readable list of items ordered"),
    quantity: z.number().int().min(1).describe("Total item count"),
    specialInstructions: z
      .string()
      .optional()
      .describe("Free-form cook notes"),
    phoneNumber: z.string().min(1).describe("Contact phone for the customer"),
  },
};

export async function createOrderHandler(
  args: z.infer<z.ZodObject<typeof createOrderSchema.inputSchema>>,
) {
  const result = await ordersApi.createOrder(args);
  return {
    content: [
      {
        type: "text" as const,
        text: `Created order ${result.id} (status=${result.status}).`,
      },
    ],
  };
}
```

### `src/tools/listOrders.ts`

```ts
import { z } from "zod";
import { ordersApi } from "../client.js";

export const listOrdersSchema = {
  name: "list_orders",
  description: "List orders by status.",
  inputSchema: {
    status: z
      .enum(["active", "completed"])
      .default("active")
      .describe("Which set of orders to return"),
  },
};

export async function listOrdersHandler(args: { status?: "active" | "completed" }) {
  const status = args.status ?? "active";
  const result = await ordersApi.listOrders(status);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result.orders, null, 2),
      },
    ],
  };
}
```

### `src/tools/markCompleted.ts`

```ts
import { z } from "zod";
import { ordersApi } from "../client.js";

export const markCompletedSchema = {
  name: "mark_order_completed",
  description: "Mark an existing active order as completed.",
  inputSchema: {
    id: z.string().min(1).describe("Convex document id of the order"),
  },
};

export async function markCompletedHandler(args: { id: string }) {
  const result = await ordersApi.markCompleted(args.id);
  return {
    content: [
      {
        type: "text" as const,
        text: `Order ${result.id} is now ${result.status}.`,
      },
    ],
  };
}
```

---

## 7. Entry point — `src/index.ts`

Stdio transport is the easiest to host; Droid / Claude Desktop / other
MCP clients can spawn it directly.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  createOrderSchema,
  createOrderHandler,
} from "./tools/createOrder.js";
import { listOrdersSchema, listOrdersHandler } from "./tools/listOrders.js";
import {
  markCompletedSchema,
  markCompletedHandler,
} from "./tools/markCompleted.js";

const server = new McpServer({
  name: "orders-mcp-server",
  version: "0.1.0",
});

server.tool(
  createOrderSchema.name,
  createOrderSchema.description,
  createOrderSchema.inputSchema,
  createOrderHandler,
);

server.tool(
  listOrdersSchema.name,
  listOrdersSchema.description,
  listOrdersSchema.inputSchema,
  listOrdersHandler,
);

server.tool(
  markCompletedSchema.name,
  markCompletedSchema.description,
  markCompletedSchema.inputSchema,
  markCompletedHandler,
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## 8. Build and run

```bash
# install
npm install

# one-off dev run
ORDERS_API_URL=http://localhost:3000 \
ORDERS_API_KEY=dev-secret \
npm run dev

# production build
npm run build
ORDERS_API_URL=https://orders.example.com \
ORDERS_API_KEY=prod-secret \
node dist/index.js
```

---

## 9. Register the MCP server with Droid

Two equivalent ways to connect this server from Droid's CLI.

### Option A — stdio (local process)

```bash
droid mcp add orders "node /abs/path/to/orders-mcp-server/dist/index.js" \
  --env ORDERS_API_URL=https://orders.example.com \
  --env ORDERS_API_KEY=prod-secret
```

Or edit `~/.factory/mcp.json` / `.factory/mcp.json`:

```json
{
  "mcpServers": {
    "orders": {
      "type": "stdio",
      "command": "node",
      "args": ["/abs/path/to/orders-mcp-server/dist/index.js"],
      "env": {
        "ORDERS_API_URL": "https://orders.example.com",
        "ORDERS_API_KEY": "prod-secret"
      },
      "disabled": false
    }
  }
}
```

### Option B — HTTP (if you wrap the server behind an HTTP transport)

If you later publish the MCP server as an HTTP endpoint (for example on
its own subdomain), register it with:

```bash
droid mcp add orders https://orders-mcp.example.com/mcp --type http \
  --header "Authorization: Bearer <mcp-server-key>"
```

Then type `/mcp` inside Droid to confirm it connected and to browse the
three tools (`create_order`, `list_orders`, `mark_order_completed`).

---

## 10. Testing the MCP server

Before hooking it up to an agent, exercise the HTTP API directly with
`curl` (see `API_BLUEPRINT.md`). Once those succeed, start the MCP
server in stdio mode and issue a `tools/list` followed by a
`tools/call` using any MCP inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Confirm that:

1. All three tools appear.
2. `create_order` produces a new row that shows up on the dashboard at
   `/`.
3. `mark_order_completed` moves the row to `/completed`.

---

## 11. Security notes

- Always set `ORDERS_API_KEY` in non-local deployments; without it the
  HTTP endpoints are open to the internet.
- Terminate TLS in front of the Next.js app (Vercel, Cloudflare, Nginx,
  etc.). Do not send the API key over plain HTTP.
- The MCP server itself is usually trusted (it runs on your own
  machine), but it should never log the API key or request bodies
  containing customer data in plaintext.
- Rotate `ORDERS_API_KEY` by changing it on both the Next.js deployment
  and the MCP server's env at the same time.
