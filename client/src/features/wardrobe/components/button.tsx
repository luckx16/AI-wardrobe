import * as React from "react";
import styles from "./button.module.css";
import { cn } from "../../../shared/lib/cnInputs";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.base,
          styles[variant],
          styles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";