# Orders API Blueprint

HTTP API exposed by this Next.js app for managing kitchen orders. These
endpoints are the integration surface your MCP server (or any other
external client) should call.

All endpoints are implemented with the Next.js App Router under
`app/api/orders/`, and delegate persistence to Convex via
`ConvexHttpClient`.

---

## Base URL

- Local dev: `http://localhost:3000`
- Production: whatever host the Next.js app is deployed to (Vercel, Fly,
  self-hosted, etc.)

All paths below are relative to this base URL.

---

## Authentication

Authentication is **optional but strongly recommended** for any
non-localhost deployment.

Set the environment variable `ORDERS_API_KEY` on the server running
Next.js. When it is set, every request to `/api/orders/*` must include
one of:

- `Authorization: Bearer <ORDERS_API_KEY>`
- `X-Api-Key: <ORDERS_API_KEY>`

If `ORDERS_API_KEY` is not set, the endpoints are open (convenient for
local development, dangerous for production).

Required server-side env vars:

| Variable             | Required | Description                                                    |
| -------------------- | -------- | -------------------------------------------------------------- |
| `CONVEX_URL`         | yes\*    | Convex deployment URL (e.g. `https://careful-fly-995.convex.cloud`). |
| `NEXT_PUBLIC_CONVEX_URL` | yes\* | Fallback if `CONVEX_URL` is not set.                           |
| `ORDERS_API_KEY`     | no       | Shared secret required by every `/api/orders/*` request when set. |

\* At least one of the two Convex URLs must be present.

---

## Data Model

An `Order` returned by the API has this shape:

```jsonc
{
  "_id": "j57d...",                 // Convex document id (string)
  "_creationTime": 1713571200000,   // ms since epoch
  "customerName": "Jane Doe",
  "items": "2x Margherita Pizza, 1x Caesar Salad",
  "quantity": 3,
  "specialInstructions": "No onions",  // optional
  "phoneNumber": "+1 555 123 4567",
  "status": "active",               // "active" | "completed"
  "createdAt": 1713571200000,
  "completedAt": 1713572000000      // present only when status === "completed"
}
```

---

## Endpoints

### 1. Create an order

`POST /api/orders`

Creates a new active order.

**Headers**

```
Content-Type: application/json
Authorization: Bearer <ORDERS_API_KEY>   # if ORDERS_API_KEY is set
```

**Request body**

```json
{
  "customerName": "Jane Doe",
  "items": "2x Margherita Pizza, 1x Caesar Salad",
  "quantity": 3,
  "specialInstructions": "No onions",
  "phoneNumber": "+1 555 123 4567"
}
```

| Field                 | Type     | Required | Notes                             |
| --------------------- | -------- | -------- | --------------------------------- |
| `customerName`        | string   | yes      | Non-empty, trimmed.               |
| `items`               | string   | yes      | Non-empty, trimmed.               |
| `quantity`            | integer  | yes      | >= 1.                             |
| `specialInstructions` | string   | no       | Trimmed; empty string omitted.    |
| `phoneNumber`         | string   | yes      | Non-empty, trimmed.               |

**Success response** — `201 Created`

```json
{
  "id": "j57d...",
  "status": "active",
  "customerName": "Jane Doe",
  "items": "2x Margherita Pizza, 1x Caesar Salad",
  "quantity": 3,
  "specialInstructions": "No onions",
  "phoneNumber": "+1 555 123 4567"
}
```

**Error responses**

- `400 Bad Request` — body is not valid JSON, or a required field is
  missing/invalid.
- `401 Unauthorized` — `ORDERS_API_KEY` is set and the request did not
  include a valid key.
- `500 Internal Server Error` — Convex call failed.

**cURL example**

```bash
curl -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORDERS_API_KEY" \
  -d '{
    "customerName": "Jane Doe",
    "items": "2x Margherita Pizza",
    "quantity": 2,
    "specialInstructions": "Extra basil",
    "phoneNumber": "+1 555 123 4567"
  }'
```

---

### 2. List orders

`GET /api/orders?status=active|completed`

Returns orders for the given status, newest first.

**Query params**

| Param    | Type   | Default   | Description                     |
| -------- | ------ | --------- | ------------------------------- |
| `status` | string | `active`  | `active` or `completed`.        |

**Success response** — `200 OK`

```json
{
  "status": "active",
  "orders": [
    { "_id": "j57d...", "customerName": "Jane Doe", "items": "...", "quantity": 3, "status": "active", "createdAt": 1713571200000 }
  ]
}
```

**Error responses**

- `400 Bad Request` — unknown `status` value.
- `401 Unauthorized` — invalid or missing API key.
- `500 Internal Server Error` — Convex call failed.

**cURL example**

```bash
curl "$BASE_URL/api/orders?status=active" \
  -H "Authorization: Bearer $ORDERS_API_KEY"
```

---

### 3. Mark an order completed

`POST /api/orders/{id}/complete`

Transitions an order from `active` to `completed` and stamps
`completedAt`.

**Path params**

| Param | Type   | Description                     |
| ----- | ------ | ------------------------------- |
| `id`  | string | Convex document id of the order. |

**Success response** — `200 OK`

```json
{ "id": "j57d...", "status": "completed" }
```

**Error responses**

- `400 Bad Request` — missing id.
- `401 Unauthorized` — invalid or missing API key.
- `500 Internal Server Error` — Convex call failed (e.g. id does not exist).

**cURL example**

```bash
curl -X POST "$BASE_URL/api/orders/$ORDER_ID/complete" \
  -H "Authorization: Bearer $ORDERS_API_KEY"
```

---

## Status codes summary

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| 200  | OK (list, complete).                        |
| 201  | Created (new order).                        |
| 400  | Validation error.                           |
| 401  | Authentication required or invalid API key. |
| 500  | Server-side error, usually from Convex.     |

---

## Error body shape

Every non-2xx response uses this JSON shape:

```json
{
  "error": "BadRequest",
  "message": "`quantity` must be an integer >= 1.",
  "details": null
}
```

- `error` — stable machine-readable code (`BadRequest`, `Unauthorized`,
  `InternalServerError`).
- `message` — human-readable description; safe to surface in logs.
- `details` — optional additional info; may be `null`.

---

## Quick integration checklist

1. Deploy this Next.js app with `CONVEX_URL` (or `NEXT_PUBLIC_CONVEX_URL`)
   set.
2. Set `ORDERS_API_KEY` to a random secret, e.g.
   `openssl rand -hex 32`.
3. From your MCP server (or any other client), call the endpoints above
   with `Authorization: Bearer <ORDERS_API_KEY>`.
4. Confirm that newly created orders appear live on the dashboard at
   `/` and, once completed, on `/completed`.
