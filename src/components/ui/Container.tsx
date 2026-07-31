import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "main" | "article";
};

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export default function Container({ children, size = "lg", className, as = "div" }: Props) {
  const Tag = as;
  return (
    <Tag className={clsx("mx-auto px-5 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </Tag>
  );
}
