import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "accent" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-3xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent  disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-primary-foreground hover:opacity-90",
  danger: "bg-danger text-primary-foreground hover:opacity-90",
  success: "bg-success text-primary-foreground hover:opacity-90",
  ghost: "bg-transparent text-inherit border-0 shadow-none backdrop-blur-none hover:bg-transparent hover:opacity-100",
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
  const classes = clsx(
    baseStyles,
    variantStyles[variant] ?? variantStyles.primary,
    sizeStyles[size],
    className,
  );

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}