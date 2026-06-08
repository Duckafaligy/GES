import { NextRequest } from "next/server";
import { verifyToken } from "./session";

/** True if the request carries a valid developer Bearer token. */
export function isDev(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return verifyToken(m[1], "dev") !== null;
}
