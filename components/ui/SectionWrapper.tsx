import { cn } from "@/lib/utils";
import React from "react";

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  tight?: boolean;
}

const SectionWrapper = React.forwardRef<HTMLElement, SectionWrapperProps>(
  ({ className, as: Tag = "section", tight = false, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(
          "w-full",
          tight ? "py-16 px-6" : "py-24 px-6",
          className
        )}
        {...props}
      >
        <div className="max-w-6xl mx-auto">{children}</div>
      </Tag>
    );
  }
);

SectionWrapper.displayName = "SectionWrapper";

export { SectionWrapper };
