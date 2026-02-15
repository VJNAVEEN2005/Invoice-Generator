import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function GlassInput({ className, ...props }) {
  return (
    <input
      className={twMerge(
        "glass-input w-full",
        className
      )}
      {...props}
    />
  );
}

