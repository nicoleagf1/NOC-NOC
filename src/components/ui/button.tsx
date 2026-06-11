import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    let baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vepagos-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    let variants = {
      primary: "bg-vepagos-green text-vepagos-navy hover:bg-vepagos-green-deep",
      secondary: "bg-vepagos-pale text-vepagos-navy hover:bg-gray-300",
      outline: "border border-vepagos-pale bg-white hover:bg-gray-50 text-vepagos-navy",
      ghost: "hover:bg-vepagos-pale text-vepagos-navy",
    };

    let sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 px-3",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
