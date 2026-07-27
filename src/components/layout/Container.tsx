import type { HTMLAttributes } from "react";

export function Container({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-(--content-width) px-(--page-gutter) ${className}`}
      {...props}
    />
  );
}
