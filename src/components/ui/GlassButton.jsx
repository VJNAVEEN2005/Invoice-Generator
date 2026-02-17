import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import { Loader2 } from "lucide-react";

export function GlassButton({ children, className, variant = "primary", isLoading, disabled, ...props }) {
    const baseClass = variant === "secondary" ? "glass-button-secondary" : "glass-button";
  return (
    <button
      className={twMerge(
        baseClass,
        (isLoading || disabled) && "opacity-70 cursor-not-allowed",
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          {typeof children === 'string' ? "Loading..." : children}
        </div>
      ) : (
        children
      )}
    </button>
  );
}

