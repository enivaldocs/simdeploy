import type { NextRequest } from "next/server";
import type { AcquisitionData } from "./users";

/** Lê o cookie first-touch (ac_attr) escrito pelo middleware. */
export function readAcquisitionCookie(request: NextRequest): AcquisitionData | null {
  const raw = request.cookies.get("ac_attr")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AcquisitionData;
    return parsed;
  } catch {
    return null;
  }
}
