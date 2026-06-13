import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", href, target, rel, children, ...props },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-primary/20",
      outline:
        "border border-border text-foreground bg-transparent hover:bg-muted hover:border-primary/50 hover:scale-[1.02]",
      ghost:
        "text-muted-foreground hover:text-foreground hover:bg-muted",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    const classes = cn(base, variants[variant], sizes[size], className);

    if (href) {
      const isExternal = target === "_blank";
      return (
        <a
          href={href}
          target={target}
          rel={isExternal ? (rel ?? "noopener noreferrer") : rel}
          className={classes}
        >
          {children}
          {isExternal && (
            <span className="sr-only"> (opens in new tab)</span>
          )}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
