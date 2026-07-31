"use client";

import { useState, useCallback, useRef } from "react";

interface FormState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

export function useFormSubmit(url: string) {
  const [state, setState] = useState<FormState>({
    loading: false,
    success: false,
    error: null,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ loading: false, success: false, error: null });
  }, []);

  const submitForm = useCallback(
    async (data: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState({ loading: true, success: false, error: null });

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Something went wrong. Please try again.");
        }

        setState({ loading: false, success: true, error: null });
        timerRef.current = setTimeout(() => {
          setState({ loading: false, success: false, error: null });
        }, 5000);
      } catch (err) {
        setState({
          loading: false,
          success: false,
          error: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [url]
  );

  return { ...state, submitForm, reset };
}
