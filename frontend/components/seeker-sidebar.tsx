"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onLoad: (content: string) => void
  onSave: () => string
}

export function SeekerSidebar({ collapsed, onToggle, onLoad, onSave }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLoadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".snt")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          onLoad(content)
        }
      }
      reader.readAsText(file)
    }
    // Reset input
    e.target.value = ""
  }

  const handleSaveClick = () => {
    const content = onSave()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `seekernotes-${Date.now()}.snt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <aside
      className={cn(
        "relative z-20 h-full transition-[width] duration-300 ease-out",
        collapsed ? "w-[64px]" : "w-[260px]",
      )}
      aria-label="Navigation"
    >
      <div className="seeker-glass h-full rounded-r-xl p-3 flex flex-col">
        <div className="flex items-center justify-between">
          <div className={cn("text-sm font-medium", collapsed ? "sr-only" : "")}>Notes</div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-8 bg-transparent"
          >
            {collapsed ? "»" : "«"}
          </Button>
        </div>

        <div className="mt-3 flex-1 overflow-auto">
          <nav className="flex flex-col gap-1">
            {["Welcome", "Project Ideas", "Daily Journal", "Todo List"].map((n, i) => (
              <button
                key={i}
                className={cn(
                  "text-left w-full rounded-md px-3 py-2 transition-colors",
                  "hover:bg-[var(--color-accent)]/30",
                )}
                title={n}
              >
                <div className={cn("truncate", collapsed ? "sr-only" : "")}>{n}</div>
                {!collapsed && <div className="text-xs opacity-60">Just now</div>}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-2 space-y-2">
          <Button className="w-full bg-transparent" variant="outline" onClick={handleLoadClick}>
            {collapsed ? "↑" : "Load"}
          </Button>

          <Button className="w-full bg-transparent" variant="outline" onClick={handleSaveClick}>
            {collapsed ? "💾" : "Save"}
          </Button>

          <Button className="w-full bg-transparent" variant="outline">
            {collapsed ? "+" : "New Note"}
          </Button>
        </div>
      </div>

      {/* Hidden file input for .snt files */}
      <input ref={fileInputRef} type="file" accept=".snt" onChange={handleFileChange} className="hidden" />
    </aside>
  )
}
