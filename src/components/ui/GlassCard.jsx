import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={twMerge(
        "glass-panel p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

