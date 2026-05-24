'use client'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"


export const CardBentoBase = ({
  children,
  className,
  wrapperClassName,
}: {
  children: React.ReactNode
  className?: string
  wrapperClassName?: string
}) => {
  return (
    <div className={cn(`
      group relative rounded-4xl bg-card/60 p-1 shadow-xs transition-colors
      duration-200 select-none
      hover:bg-card/60
    `, wrapperClassName)}>
      <div className="relative size-full p-6">
        <div className={`
          pointer-events-none absolute inset-x-0 top-0 h-3/5 rounded-3xl
          bg-linear-to-b from-background to-transparent
        `} />
        <div className={cn('relative size-full', className)}>
            {children}
        </div>
      </div>
    </div>
  )
}

export const MotionCardBentoBase = motion(CardBentoBase);
  