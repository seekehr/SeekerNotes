"use client"
import { forwardRef, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils"
import { FontStyle, htmlToSnt, sntToHtml } from "@/utils/parser"
import { StyleKey } from "@/hooks/use-styles-manager"

export interface EditorHandle {
  toggleStyle: (key: StyleKey) => void
  getSntContent: () => Promise<string>
  setSntContent: (content: string) => void
  getHtmlContent: () => string
}

interface EditorProps {
  fontStyle: FontStyle
  onBodyClick: () => void
  onContentChange?: () => void
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
}

export const TextEditor = forwardRef<EditorHandle, EditorProps>(function TextEditor(props, ref) {
  const { fontStyle, onBodyClick, onContentChange, stylesManager, fontSizeManager } = props
  const editorRef = useRef<HTMLDivElement>(null)

  const pickFont = (fontStyle: FontStyle): [string, string] => {
    switch (fontStyle) {
      case "retro":
        return ["var(--font-geist-mono)", "0em"]
      case "stylish":
        return ["var(--font-geist-sans)", "0.02em"]
      default:
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
    toggleStyle(key: StyleKey) {
      focusEditor()
      stylesManager.toggleStyle(key)
      setTimeout(() => {
        document.dispatchEvent(new Event('selectionchange'))
      }, 0)
    },

    async getSntContent() {
      const html = editorRef.current?.innerHTML || ""
      return htmlToSnt(html, fontStyle)
    },

    setSntContent(content: string) {
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