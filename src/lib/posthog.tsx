"use client";
// src/lib/posthog.tsx
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false, // we handle this manually
        capture_pageleave: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.debug();
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Analytics events
export const analytics = {
  identify(userId: string, traits?: Record<string, unknown>) {
    posthog.identify(userId, traits);
  },
  track(event: string, properties?: Record<string, unknown>) {
    posthog.capture(event, properties);
  },
  page(pageName: string, properties?: Record<string, unknown>) {
    posthog.capture("$pageview", { page: pageName, ...properties });
  },
  reset() {
    posthog.reset();
  },

  // Specific events
  assetViewed(assetId: string, assetTitle: string) {
    posthog.capture("asset_viewed", { asset_id: assetId, asset_title: assetTitle });
  },
  assetDownloaded(assetId: string, plan: string, currency: string) {
    posthog.capture("asset_downloaded", { asset_id: assetId, plan, currency });
  },
  subscriptionStarted(plan: string, currency: string, amount: number) {
    posthog.capture("subscription_started", { plan, currency, amount });
  },
  subscriptionCancelled(plan: string) {
    posthog.capture("subscription_cancelled", { plan });
  },
  signedUp(role: string) {
    posthog.capture("signed_up", { role });
  },
  assetUploaded(assetType: string) {
    posthog.capture("asset_uploaded", { asset_type: assetType });
  },
  searchPerformed(query: string, resultsCount: number) {
    posthog.capture("search_performed", { query, results_count: resultsCount });
  },
};
