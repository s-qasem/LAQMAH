import type { ComponentPropsWithoutRef } from "react";

export function Section({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`w-full py-16 md:py-24 ${className}`} {...props} />;
}
