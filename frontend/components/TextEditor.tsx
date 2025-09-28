"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils"
import { FontStyle, htmlToSnt, sntToHtml } from "@/utils/parser"
import { BoldStyle, ItalicStyle, UnderlineStyle } from "@/utils/styles/Styles"

export interface EditorHandle {
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  applyFontSize: (size: number) => void
  getSntContent: () => Promise<string>
  setSntContent: (content: string) => void
  getHtmlContent: () => string
}

interface EditorProps {
  styles: {bold: BoldStyle, italic: ItalicStyle, und: UnderlineStyle}
  fontStyle: FontStyle
  onBodyClick: () => void
  onContentChange?: () => void
}

export const TextEditor = forwardRef<EditorHandle, EditorProps>(function TextEditor(props, ref) {
  const { fontStyle, onBodyClick, onContentChange, styles } = props
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
      styles.bold.apply()
      // Trigger a selection change event to update state
      setTimeout(() => {
        document.dispatchEvent(new Event('selectionchange'))
      }, 0)
    },
    toggleItalic() {
      focusEditor()
      styles.italic.apply()
      // Trigger a selection change event to update state
      setTimeout(() => {
        document.dispatchEvent(new Event('selectionchange'))
      }, 0)
    },
    toggleUnderline() {
      focusEditor()
      styles.und.apply()
      // Trigger a selection change event to update state
      setTimeout(() => {
        document.dispatchEvent(new Event('selectionchange'))
      }, 0)
    },
    applyFontSize(size: number) { // TODO
      //applyFormatting('span', `font-size: ${size}px`)
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
    getHtmlContent() {
      return editorRef.current?.innerHTML || ""
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
          onInput={onContentChange}
          onKeyUp={onContentChange}
          onPaste={onContentChange}
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
