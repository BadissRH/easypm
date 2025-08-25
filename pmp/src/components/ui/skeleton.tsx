import { cn } from "@/lib/utils"

/**
 * A placeholder component to indicate that content is loading.
 * It displays a pulsing, gray box to mimic the layout of the content it replaces.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The component props.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @returns {JSX.Element} The skeleton loader component.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

    