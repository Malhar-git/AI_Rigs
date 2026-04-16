import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "accent" | "danger" | "success" | "ghost" | "sweep";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-3xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 cursor-pointer";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted-foreground/10",
  accent: "bg-accent text-white hover:opacity-90",
  danger: "bg-danger text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
  ghost: "bg-transparent text-inherit border-0 shadow-none backdrop-blur-none",
  sweep: "relative overflow-hidden text-primary-foreground bg-transparent group",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-md",
  lg: "h-12 px-6 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const isSweep = variant === "sweep";

  const classes = clsx(
    baseStyles,
    variantStyles[variant] ?? variantStyles.primary,
    sizeStyles[size],
    className,
  );

  return (
    <button type={type} className={classes} {...props}>
      {isSweep ? (
        <>
          <span className="relative z-10">{children}</span>
          <span
            className="absolute inset-0 -translate-x-full bg-linear-to-r from-gray-200 to-gray-500 transition-transform duration-500 ease-in-out group-hover:translate-x-0"
            aria-hidden="true"
          />
        </>
      ) : (
        children
      )}
    </button>
  );
}