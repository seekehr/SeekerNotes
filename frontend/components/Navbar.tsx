"use client"

import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { isOnDesktop } from "@/utils/utils"

type FontStyle = "normal" | "retro" | "stylish"

export interface TopbarProps {
  visible: boolean
  pinned: boolean
  onTogglePinned: () => void
  fontStyle: FontStyle
  onFontStyleChange: (v: FontStyle) => void
  fontSize: number
  onFontSizeChange: (v: number) => void
  bold: boolean
  italic: boolean
  underline: boolean
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
}

export function Topbar(props: TopbarProps) {
  const {
    visible,
    pinned,
    onTogglePinned,
    fontStyle,
    onFontStyleChange,
    fontSize,
    onFontSizeChange,
    bold,
    italic,
    underline,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
  } = props

  const barClass = useMemo(
    () =>
      cn(
        "fixed z-40 left-0 right-0 top-0 mx-auto w-full max-w-[1400px]",
        "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none",
      ),
    [visible],
  )

  return (
    <div className={barClass} role="toolbar" aria-label="Editor toolbar">
      <div className={cn("glass rounded-xl mt-3 mx-3 px-3 py-2")}>
        <div className="flex items-center gap-3">
          {/* Pin / Unpin */}
          <Button
            type="button"
            variant="outline"
            onClick={onTogglePinned}
            aria-pressed={pinned}
            className={cn("h-9 px-3 rounded-md", pinned ? "pop" : "")}
            title={pinned ? "Unpin toolbar" : "Pin toolbar"}
          >
            <span aria-hidden="true">{pinned ? "📌" : "📍"}</span>
            <span className="sr-only">{pinned ? "Unpin toolbar" : "Pin toolbar"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">Size</span>
            <div className="w-40">
              <Slider
                value={[fontSize]}
                min={4}
                max={30}
                step={1}
                onValueChange={(v) => onFontSizeChange(v[0] ?? fontSize)}
                aria-label="Font size"
              />
            </div>
            <span className="text-xs tabular-nums w-6 text-center">{fontSize}</span>
          </div>

          {/* Font options: Normal / Retro / Stylish */}
          <div className="flex items-center gap-2 ml-1">
            {(["normal", "retro", "stylish"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onFontStyleChange(opt)}
                className={cn(
                  "h-9 w-9 rounded-md border",
                  "flex items-center justify-center",
                  "transition-transform",
                  "hover:scale-[1.03]",
                  fontStyle === opt ? "pop border-foreground/40" : "",
                )}
                aria-pressed={fontStyle === opt}
                aria-label={`${opt} font`}
                title={`${opt} font`}
              >
                <span className={cn("select-none font-bold", "text-[var(--color-primary-foreground)]")}>F</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[var(--color-border)]/60 mx-1" aria-hidden="true" />

          {/* Bold / Italic / Underline */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onToggleBold}
              aria-pressed={bold}
              className={cn("h-9 px-3 rounded-md", bold ? "pop" : "")}
              title="Bold"
            >
              <span className="font-bold">B</span>
              <span className="sr-only">Toggle bold</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onToggleItalic}
              aria-pressed={italic}
              className={cn("h-9 px-3 rounded-md italic", italic ? "pop" : "")}
              title="Italic"
            >
              <span>I</span>
              <span className="sr-only">Toggle italic</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onToggleUnderline}
              aria-pressed={underline}
              className={cn("h-9 px-3 rounded-md", underline ? "pop" : "")}
              title="Underline"
            >
              <span className="underline decoration-2 underline-offset-2">U</span>
              <span className="sr-only">Toggle underline</span>
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}
