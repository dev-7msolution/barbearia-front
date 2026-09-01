import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse" | "brand" | "onColor";
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg text-sm font-semibold",
          tone === "inverse"
            ? "bg-white text-neutral-950"
            : tone === "onColor"
              ? "bg-white text-neutral-950"
              : tone === "brand"
                ? "bg-[oklch(0.86_0.17_95)] text-neutral-950"
                : "bg-primary text-primary-foreground",
        )}
      >
        B
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          tone === "inverse" && "text-white",
          (tone === "brand" || tone === "onColor") && "text-neutral-950",
        )}
      >
        Barbearia
      </span>
    </Link>
  );
}
