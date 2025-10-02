"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { STYLE_CONFIG, StyleKey } from "@/hooks/use-styles-manager"

type FontStyle = "normal" | "retro" | "stylish"

export interface TopbarProps {
  visible: boolean
  pinned: boolean
  onTogglePinned: () => void
  fontStyle: FontStyle
  onFontStyleChange: (v: FontStyle) => void
  stylesManager: {
    toggleStyle: (key: StyleKey) => void
    isStyleActive: (key: StyleKey) => boolean
    activeStyles: Set<StyleKey>
    updateActiveStyles: () => void
  }
  fontSizeManager: {
    fontSize: number
    setFontSize: (size: number) => void
    applyFontSize: (size: number) => void
    getCurrentFontSize: () => number
  }
  onToggleStyle: (key: StyleKey) => void
}

export function Topbar(props: TopbarProps) {
  const {
    visible,
    pinned,
    onTogglePinned,
    fontStyle,
    onFontStyleChange,
    stylesManager,
    fontSizeManager,
    onToggleStyle,
  } = props

  const currentSize = fontSizeManager.getCurrentFontSize()

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
                value={[currentSize]}
                min={4}
                max={30}
                step={1}
                onValueChange={(v) => {
                  fontSizeManager.setFontSize(v[0] ?? currentSize)
                }}
                onValueCommit={(v) => {
                  fontSizeManager.applyFontSize(v[0] ?? currentSize)
                }}
                aria-label="Font size"
              />
            </div>
            <span className="text-xs tabular-nums w-6 text-center">{currentSize}</span>
          </div>

          <div className="flex items-center gap-2 ml-1">
            {(["normal", "retro", "stylish"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onFontStyleChange(opt)}
                className={cn(
                  "h-9 w-9 rounded-md border font-button",
                  "flex items-center justify-center",
                  "transition-transform",
                  "hover:scale-[1.03]",
                  fontStyle === opt ? "pop border-foreground/40" : "",
                )}
                aria-pressed={fontStyle === opt}
                aria-label={`${opt} font`}
                title={`${opt} font`}
              >
                <span className={cn("select-none font-bold")}>F</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-[var(--color-border)]/60 mx-1" aria-hidden="true" />

          <div className="flex items-center gap-2">
            {Object.entries(STYLE_CONFIG).map(([key, config]) => {
              const isActive = stylesManager.isStyleActive(key as StyleKey)
              
              let buttonContent: React.ReactNode
              if (key === 'bold') {
                buttonContent = <span className="font-bold">B</span>
              } else if (key === 'italic') {
                buttonContent = <span className="italic">I</span>
              } else if (key === 'underline') {
                buttonContent = <span className="underline decoration-2 underline-offset-2">U</span>
              } else {
                buttonContent = <span>{config.label[0]}</span>
              }

              return (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  onClick={() => onToggleStyle(key as StyleKey)}
                  aria-pressed={isActive}
                  className={cn(
                    "h-9 px-3 rounded-md formatting-button",
                    isActive ? "pop" : ""
                  )}
                  title={`${config.label} (${config.keybind})`}
                >
                  {buttonContent}
                  <span className="sr-only">Toggle {config.label}</span>
                </Button>
              )
            })}
          </div>

          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}