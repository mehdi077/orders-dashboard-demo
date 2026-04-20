import { ConvexHttpClient } from "convex/browser";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (client) return client;
  const url =
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error(
      "Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) environment variable.",
    );
  }
  client = new ConvexHttpClient(url);
  return client;
}
