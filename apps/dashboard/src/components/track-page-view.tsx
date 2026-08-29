"use client";

import { useEffect } from "react";

/** Emite um evento de funil ao montar (páginas públicas estáticas). */
export function TrackPageView({ event }: { event: string }) {
  useEffect(() => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: event }),
      keepalive: true,
    }).catch(() => {});
  }, [event]);
  return null;
}
