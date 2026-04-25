"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { getSession, isCameraRestricted, logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LensScoreLogo } from "@/components/layout/lensscore-logo"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/turmas", label: "Turmas" },
  { href: "/camera", label: "Câmera" },
]

export function AppHeader() {
  const pathname = usePathname()
  const isCameraRoute = pathname.startsWith("/camera")
  const [cameraVisible, setCameraVisible] = useState(false)

  useEffect(() => {
    setCameraVisible(!isCameraRestricted(getSession()))
  }, [])

  const visibleNavigationItems = navigationItems.filter((item) => item.href !== "/camera" || cameraVisible)

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3">
      <LensScoreLogo
        size={isCameraRoute ? "sm" : "md"}
        subtitle="Exam Intelligence"
        className="justify-self-start"
      />

      <nav className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
        {visibleNavigationItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-[4rem] px-2 text-xs sm:min-w-24 sm:px-3 sm:text-sm",
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100",
              )}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          )
        })}
      </nav>

      <Button
        variant="outline"
        size="icon"
        className="justify-self-end border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100"
        onClick={logout}
        aria-label="Sair"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  )
}