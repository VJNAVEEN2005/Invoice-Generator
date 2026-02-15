import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function GlassButton({ children, className, variant = "primary", ...props }) {
    const baseClass = variant === "secondary" ? "glass-button-secondary" : "glass-button";
  return (
    <button
      className={twMerge(
        baseClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

