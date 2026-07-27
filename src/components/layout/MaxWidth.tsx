import type { HTMLAttributes } from "react";

export function MaxWidth({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-(--content-width-narrow) ${className}`}
      {...props}
    />
  );
}
