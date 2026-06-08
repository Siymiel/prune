"use client";

import { useState, useEffect } from "react";

// Module-level cache so the fetch happens once per page load across all component instances
let cachedIcons: Record<string, string> | null = null;
let inflightPromise: Promise<Record<string, string>> | null = null;

export function useBrandIcons(): Record<string, string> {
  const [icons, setIcons] = useState<Record<string, string>>(cachedIcons ?? {});

  useEffect(() => {
    if (cachedIcons) return;

    if (!inflightPromise) {
      inflightPromise = fetch("/api/brand-icons")
        .then((r) => r.json() as Promise<Record<string, string>>)
        .then((data) => {
          cachedIcons = data;
          return data;
        })
        .catch(() => {
          inflightPromise = null;
          return {} as Record<string, string>;
        });
    }

    inflightPromise.then(setIcons);
  }, []);

  return icons;
}
