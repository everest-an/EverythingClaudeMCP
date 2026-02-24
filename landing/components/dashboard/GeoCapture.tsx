"use client";

import { useEffect } from "react";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function GeoCapture() {
  useEffect(() => {
    const key = "geo_captured";
    if (sessionStorage.getItem(key)) return;

    // Read UTM and referrer cookies set by middleware
    const utmRaw = getCookie("ac_utm");
    const ref = getCookie("ac_ref");

    let source: string | undefined;
    if (utmRaw) {
      try {
        const utm = JSON.parse(utmRaw);
        source = utm.source || undefined;
      } catch { /* malformed cookie */ }
    } else if (ref) {
      source = ref;
    }

    fetch("/api/me/geo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    }).catch(() => {});
    sessionStorage.setItem(key, "1");
  }, []);
  return null;
}
