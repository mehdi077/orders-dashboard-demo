import { NextResponse } from "next/server";

export function requireApiKey(request: Request): NextResponse | null {
  const expected = process.env.ORDERS_API_KEY;
  if (!expected) {
    return null;
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  const xApiKey = request.headers.get("x-api-key");
  const provided = bearer ?? xApiKey;

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  return null;
}
