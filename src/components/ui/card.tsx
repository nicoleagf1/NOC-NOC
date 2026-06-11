import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-[var(--radius-card)] border border-gray-100 bg-white text-vepagos-navy shadow-sm ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
