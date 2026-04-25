import { cn } from "@/lib/utils"

type LensScoreLogoSize = "sm" | "md" | "lg"

const logoSizeClasses: Record<LensScoreLogoSize, { title: string; subtitle: string }> = {
  sm: {
    title: "text-lg sm:text-xl",
    subtitle: "text-[0.55rem] sm:text-[0.6rem]",
  },
  md: {
    title: "text-2xl sm:text-[1.7rem]",
    subtitle: "text-[0.62rem] sm:text-[0.7rem]",
  },
  lg: {
    title: "text-3xl sm:text-4xl",
    subtitle: "text-[0.72rem] sm:text-[0.8rem]",
  },
}

interface LensScoreLogoProps {
  className?: string
  size?: LensScoreLogoSize
  subtitle?: string
}

export function LensScoreLogo({ className, size = "md", subtitle = "Exam Intelligence" }: LensScoreLogoProps) {
  const sizeClasses = logoSizeClasses[size]

  return (
    <div className={cn("flex flex-col leading-none", className)} aria-label="LensScore">
      <span className={cn("font-semibold tracking-[-0.05em] text-slate-950", sizeClasses.title)}>
        <span className="text-sky-600">Lens</span>
        <span className="text-blue-950">Score</span>
      </span>
      <span className={cn("mt-1 font-medium uppercase tracking-[0.22em] text-slate-500", sizeClasses.subtitle)}>
        {subtitle}
      </span>
    </div>
  )
}