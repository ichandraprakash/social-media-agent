import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

/** A Next.js Link styled as a Button. */
function ButtonLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { ButtonLink };
