import * as React from "react";
import { cn } from "@/lib/utils";

const Pagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-1 text-sm",
      className
    )}
    {...props}
  />
));
Pagination.displayName = "Pagination";

export { Pagination };