import * as React from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex flex-row items-center justify-center rounded-xl active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-blue-600",
        destructive: "bg-red-500",
        outline: "border-2 border-blue-600 bg-transparent",
        secondary: "bg-gray-200",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4",
        lg: "h-14 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("font-semibold", {
  variants: {
    variant: {
      default: "text-white text-base",
      destructive: "text-white text-base",
      outline: "text-blue-600 text-base",
      secondary: "text-gray-800 text-base",
      ghost: "text-blue-600 text-base",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label: string;
  };

function Button({ label, variant, size, className, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <Text className={cn(buttonTextVariants({ variant, size }))}>
        {label}
      </Text>
    </Pressable>
  );
}

export { Button, buttonVariants };
