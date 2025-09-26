"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils"
import { FontStyle, applyFormatting, htmlToSnt, sntToHtml } from "@/utils/parser"

export interface EditorHandle {
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  applyFontSize: (size: number) => void
  getSntContent: () => Promise<string>
  setSntContent: (content: string) => void
}

interface EditorProps {
  fontStyle: FontStyle
  onBodyClick: () => void
}

export const TextEditor = forwardRef<EditorHandle, EditorProps>(function TextEditor(props, ref) {
  const { fontStyle, onBodyClick } = props
  const editorRef = useRef<HTMLDivElement>(null)

  const pickFont = (fontStyle: FontStyle): [string, string] => {
    switch (fontStyle) {
      case "retro":
        return ["var(--font-geist-mono)", "0em"]
      case "stylish":
        return ["var(--font-geist-sans)", "0.02em"]
      default: // "normal"
        return ["var(--font-geist-sans)", "0em"]
    }
  }

  const [family, letterSpacing] = pickFont(fontStyle)


  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  useImperativeHandle(ref, () => ({
    toggleBold() {
      focusEditor()
      applyFormatting('strong')
    },
    toggleItalic() {
      focusEditor()
      applyFormatting('em')
    },
    toggleUnderline() {
      focusEditor()
      applyFormatting('u')
    },
    applyFontSize(size: number) {
      applyFormatting('span', `font-size: ${size}px`)
    },
    async getSntContent() {
      const html = editorRef.current?.innerHTML || ""
      return htmlToSnt(html, fontStyle)
    },
    async setSntContent(content: string) {
      if (editorRef.current) {
        editorRef.current.innerHTML = sntToHtml(content)
      }
    },
  }))

  return (
    <main className="flex-1 h-full overflow-hidden">
      {/* Hover strip to reveal toolbar */}
      <div className="reveal-zone" />

      <div className="h-full w-full overflow-auto">
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onMouseDown={onBodyClick}
          className={cn("h-full w-full p-8 outline-none", "text-pretty leading-relaxed")}
          style={{
            fontFamily: family,
            letterSpacing: letterSpacing,
            minHeight: "100vh",
          }}
        >
          <p>
            Start writing... Click here to focus. The top bar auto-hides while you write. Hover near
            the top edge to reveal it again.
          </p>
          <p className="mt-4 opacity-80">
            Use the size slider, pick a font style (Normal, Retro, Stylish), and toggle Bold, Italic, or Underline.
          </p>
        </div>
      </div>
    </main>
  )
})
