"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ThreeDCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gradient?: string
  interactive?: boolean
}

export const ThreeDCard = React.forwardRef<HTMLDivElement, ThreeDCardProps>(
  ({ className, children, gradient, interactive = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "three-d-card relative overflow-hidden rounded-[24px] border border-white/10 p-6",
          gradient ? gradient : "bg-card text-card-foreground",
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ThreeDCard.displayName = "ThreeDCard"
