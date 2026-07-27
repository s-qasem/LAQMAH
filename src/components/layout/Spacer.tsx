import type { CSSProperties } from "react";

type SpacerProps = {
  size?: string;
  className?: string;
};

export function Spacer({ size = "2rem", className = "" }: SpacerProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ "--spacer-size": size, height: "var(--spacer-size)" } as CSSProperties}
    />
  );
}
