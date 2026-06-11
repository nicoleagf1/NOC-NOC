import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "danger" | "warning" | "info" | "default";
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-vepagos-green focus:ring-offset-2";

  let variants = {
    default: "border-transparent bg-vepagos-pale text-vepagos-navy",
    success: "border-transparent bg-vepagos-green/20 text-vepagos-green-deep",
    danger: "border-transparent bg-red-100 text-red-700",
    warning: "border-transparent bg-yellow-100 text-yellow-800",
    info: "border-transparent bg-blue-100 text-blue-700",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}

export { Badge };
