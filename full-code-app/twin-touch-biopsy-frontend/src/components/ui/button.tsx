import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:-translate-y-0.5 glow-button",
        destructive: "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:shadow-emergency hover:-translate-y-0.5",
        outline: "border-2 border-primary/30 bg-card/50 text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-glow backdrop-blur-sm",
        secondary: "bg-gradient-control text-secondary-foreground hover:bg-secondary/60 hover:-translate-y-0.5",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground hover:shadow-accent-glow",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        medical: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:-translate-y-0.5 border border-primary/20",
        control: "bg-gradient-card border border-border/50 text-foreground hover:bg-accent/20 hover:border-accent/50 hover:shadow-accent-glow backdrop-blur-sm",
        emergency: "bg-gradient-to-r from-emergency to-emergency/90 text-emergency-foreground hover:shadow-emergency hover:-translate-y-0.5 animate-pulse font-bold border border-emergency/50",
        success: "bg-gradient-to-r from-success to-success/90 text-success-foreground hover:shadow-[0_0_20px_hsl(var(--success)/0.4)] hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:shadow-[0_0_20px_hsl(var(--warning)/0.4)] hover:-translate-y-0.5",
        accent: "bg-gradient-accent text-accent-foreground hover:shadow-accent-glow hover:-translate-y-0.5 glow-accent",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg font-bold",
        icon: "h-12 w-12",
        control: "h-16 w-full text-lg font-bold rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
