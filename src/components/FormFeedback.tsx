"use client";

import { useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface FormFeedbackProps {
  loading: boolean;
  success: boolean;
  error: string | null;
  successMessage?: string;
  reset: () => void;
}

export default function FormFeedback({
  loading,
  success,
  error,
  successMessage,
  reset,
}: FormFeedbackProps) {
  const tc = useTranslations("common");

  // Auto-dismiss success after 6 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(reset, 6000);
    return () => clearTimeout(timer);
  }, [success, reset]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 mt-4 text-ocean">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{tc("sending")}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 mt-4 text-green-600">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{successMessage ?? tc("messageSent")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 mt-4 text-red-500">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{error}</span>
        <button
          onClick={reset}
          className="text-sm underline hover:text-red-400 transition-colors ml-2"
        >
          {tc("tryAgain")}
        </button>
      </div>
    );
  }

  return null;
}
