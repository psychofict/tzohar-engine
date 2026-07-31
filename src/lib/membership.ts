"use client";

import { useEffect, useState } from "react";
import { membership as cfg } from "@/config/membership";
import { planByHubPlan } from "@/data/plans";

// ─────────────────────────────────────────────────────────────────────────────
// Membership — the single client-side seam for accounts + paid tiers. It is
// PROVIDER-AGNOSTIC: the public API (useMembership, startCheckout, signInUrl,
// hubAccountUrl, logoutUrl) is stable; the provider (set in src/config/membership)
// decides where state and billing come from.
//
//   • "hub"    — Ebenworks SSO hub (as the reference build uses). Reads
//                ${NEXT_PUBLIC_ACCOUNTS_URL}/api/session-info and links out for
//                login/checkout/billing. No secrets here.
//   • "stripe" — client-owned Stripe via same-origin routes under
//                /api/membership/* (see src/lib/stripe.ts + docs/membership.md).
//   • "none"   — no membership; everything reads signed-out / not-a-member.
//
// Both providers return the SAME session shape, so the hook below is shared.
// Fails CLOSED (signed-out / not-a-member) on any error.
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER = cfg.provider;
/*
 * No fallback. This used to default to the reference build's hub product code, so
 * a client who forgot to set it would silently ask the hub about SOMEBODY ELSE'S
 * subscriptions — an answer that looks valid and is wrong. An empty string makes
 * the gate fail closed instead, which is this module's stated contract.
 */
const HUB_PRODUCT = cfg.hubProduct ?? "";

export interface Membership {
  active: boolean;
  plan: string | null;
  planName?: string;
  status?: string;
  renewsAt?: string;
  manageUrl?: string;
}

interface SessionInfo {
  signedIn: boolean;
  name: string | null;
  email: string | null;
  image: string | null;
  membership?: Membership;
}

export interface MembershipState {
  loading: boolean;
  signedIn: boolean;
  /** Signed in AND holding an active paid subscription. */
  member: boolean;
  plan: string | null;
  planName: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  /** Billing / account management URL. */
  manageUrl: string;
  /** Login URL with a callback back to the current page (provider-specific). */
  signInUrl: string;
  /** Sign-out URL with a callback back to the current page (provider-specific). */
  logoutUrl: string;
}

function hubBase(): string {
  return (process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "").replace(/\/+$/, "");
}

/**
 * The current page URL — but only once we're sure a browser reconciled this
 * render (`allowWindow`), so SSR and the FIRST client render agree on
 * `fallback` and React never sees a hydration mismatch. Callers that only run
 * client-side (click handlers, `startCheckout`'s 401 redirect) always pass
 * `true`; render-time callers thread through a post-mount flag instead.
 */
function here(fallback: string, allowWindow = true): string {
  return allowWindow && typeof window !== "undefined" ? window.location.href : fallback;
}

/** Where useMembership() reads session state, or null when unconfigured. */
function sessionUrl(): string | null {
  if (PROVIDER === "hub") {
    const b = hubBase();
    return b ? `${b}/api/session-info?product=${HUB_PRODUCT}` : null;
  }
  if (PROVIDER === "stripe") return "/api/membership/session";
  return null;
}

export function signInUrl(allowWindow = true): string {
  if (PROVIDER === "hub") {
    const b = hubBase();
    return `${b}/login?product=${HUB_PRODUCT}&callbackUrl=${encodeURIComponent(here(b || "/", allowWindow))}`;
  }
  if (PROVIDER === "stripe") return "/account";
  return "/";
}

/** Account / billing management URL. */
export function hubAccountUrl(): string {
  if (PROVIDER === "hub") {
    const b = hubBase();
    return b ? `${b}/account` : "/";
  }
  return "/account";
}

/** Sign out, then return here. */
export function logoutUrl(allowWindow = true): string {
  if (PROVIDER === "hub") {
    const b = hubBase();
    return `${b}/logout?callbackUrl=${encodeURIComponent(here(b || "/", allowWindow))}`;
  }
  if (PROVIDER === "stripe") return "/api/membership/logout";
  return "/";
}

/**
 * Start checkout for a plan. `planId` is the hub Plan enum for the hub provider
 * (e.g. "STARTER") — kept for backward compatibility; for Stripe it is mapped
 * back to the plan slug. Redirects to the hosted checkout, or to sign-in on 401.
 */
export async function startCheckout(planId: string, interval: "month" | "year" = "month"): Promise<void> {
  if (PROVIDER === "none") return;
  const url = PROVIDER === "hub" ? "/api/checkout" : "/api/membership/checkout";
  const plan = PROVIDER === "hub" ? planId : planByHubPlan(planId)?.slug ?? planId;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ plan, interval }),
  });
  if (res.status === 401) {
    window.location.href = signInUrl();
    return;
  }
  const data = await res.json().catch(() => null);
  if (res.ok && data?.redirectUrl) {
    window.location.href = data.redirectUrl;
    return;
  }
  throw new Error(data?.error || "Checkout is unavailable right now.");
}

export function useMembership(): MembershipState {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  // Lazy init: nothing to fetch (no provider/hub) → not loading.
  const [loading, setLoading] = useState(() => !!sessionUrl());
  // signInUrl/logoutUrl embed the current page URL — reading it before the
  // browser has hydrated would mismatch the SSR-rendered fallback, so both
  // start `false` (server and first client render agree) and flip after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = sessionUrl();
    if (!url) return; // nothing to fetch; loading already false
    fetch(url, {
      // hub is cross-origin (shared cookie); stripe is same-origin.
      credentials: PROVIDER === "hub" ? "include" : "same-origin",
      headers: { accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: SessionInfo | null) => {
        if (cancelled) return;
        setInfo(body && typeof body === "object" ? body : null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInfo(null); // fail-closed
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = !!info?.signedIn;
  const m = info?.membership;
  const member = signedIn && !!m?.active;

  return {
    loading,
    signedIn,
    member,
    plan: member ? m?.plan ?? null : null,
    planName: member ? m?.planName ?? m?.plan ?? null : null,
    name: info?.name ?? null,
    email: info?.email ?? null,
    image: info?.image ?? null,
    manageUrl: m?.manageUrl || hubAccountUrl(),
    signInUrl: signInUrl(mounted),
    logoutUrl: logoutUrl(mounted),
  };
}
