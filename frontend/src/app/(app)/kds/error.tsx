"use client";

import { SegmentError } from "@/components/shared/segment-error";

export default function KdsSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      error={error}
      reset={reset}
      title="Kitchen display unavailable"
      description="The kitchen display hit an error. You can retry or return to the dashboard."
    />
  );
}
