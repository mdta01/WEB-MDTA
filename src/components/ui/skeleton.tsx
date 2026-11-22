import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Premium: skeleton-premium uses a brand-tinted shimmer gradient (emerald)
      // instead of the default gray pulse — feels more cohesive with the
      // madrasah's emerald/gold brand palette.
      className={cn("skeleton-premium rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

