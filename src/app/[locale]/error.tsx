"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="band flex min-h-[70svh] items-center">
      <Container size="xl">
        <div className="measure">
          <div className="mb-7 flex items-center gap-3.5">
            <span className="accent-rule" aria-hidden />
            <Eyebrow>Error</Eyebrow>
            <span className="bg-line h-px flex-1" aria-hidden />
          </div>
          <h1 className="type-display text-ink leading-[1.1] text-[calc(clamp(2rem,4vw,3rem)*var(--display-scale))]">
            This page didn&apos;t load
          </h1>
          <p className="text-ink-2 mt-5 text-[17px] leading-relaxed">
            Something failed on our side, not yours. Trying again usually works; if it doesn&apos;t, the
            contact page still does.
          </p>
          {/* A digest is what support can actually act on — showing it beats
              asking someone to describe a blank screen. */}
          {error.digest && <p className="type-record text-ink-3 mt-5">Reference: {error.digest}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/contact"
              className="border-line-strong text-ink hover:bg-surface inline-flex h-11 items-center justify-center rounded-[var(--radius-pill)] border px-6 text-[15px] font-semibold transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
