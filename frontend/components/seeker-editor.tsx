"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils"

type FontStyle = "normal" | "retro" | "stylish"

export interface SeekerEditorHandle {
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  applyFontSize: (size: number) => void
  getSntContent: () => string
  setSntContent: (content: string) => void
}

interface EditorProps {
  fontStyle: FontStyle
  onBodyClick: () => void
}

export const SeekerEditor = forwardRef<SeekerEditorHandle, EditorProps>(function SeekerEditor(props, ref) {
  const { fontStyle, onBodyClick } = props
  const editorRef = useRef<HTMLDivElement>(null)

  const family = fontStyle === "retro" ? "var(--font-geist-mono)" : "var(--font-geist-sans)"
  const stylishExtras = fontStyle === "stylish" ? "0.02em" : "0em"

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const normalizeFontTags = (px: number) => {
    const root = editorRef.current
    if (!root) return
    const fonts = root.querySelectorAll('font[size="7"]')
    fonts.forEach((node) => {
      const span = document.createElement("span")
      span.setAttribute("style", `font-size:${px}px;`)
      while (node.firstChild) span.appendChild(node.firstChild)
      node.replaceWith(span)
    })
  }

  const htmlToSnt = (html: string, currentFontStyle: FontStyle): string => {
    const fontMap: Record<FontStyle, string> = {
      normal: "GEIST_SANS",
      retro: "FIRA_CODE",
      stylish: "GEIST_STYLISH",
    }

    let snt = `[FONT:${fontMap[currentFontStyle]}]\n`

    // Create a temporary div to parse HTML
    const temp = document.createElement("div")
    temp.innerHTML = html

    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ""
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const children = Array.from(node.childNodes).map(processNode).join("")

        // Handle formatting tags
        if (element.tagName === "B" || element.tagName === "STRONG") {
          return `[BOLD]${children}[/BOLD]`
        }
        if (element.tagName === "I" || element.tagName === "EM") {
          return `[ITALIC]${children}[/ITALIC]`
        }
        if (element.tagName === "U") {
          return `[UNDERLINE]${children}[/UNDERLINE]`
        }
        if (element.tagName === "SPAN" && element.style.fontSize) {
          const size = Number.parseInt(element.style.fontSize)
          if (!isNaN(size)) {
            return `[SIZE:${size}]${children}[/SIZE]`
          }
        }
        if (element.tagName === "P" || element.tagName === "DIV") {
          return children + "\n"
        }

        return children
      }

      return ""
    }

    snt += processNode(temp)
    return snt.trim()
  }

  const sntToHtml = (snt: string): string => {
    let html = snt

    // Remove font declaration line
    html = html.replace(/^\[FONT:[^\]]+\]\s*\n?/, "")

    // Convert tags to HTML
    html = html.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, "<strong>$1</strong>")
    html = html.replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, "<em>$1</em>")
    html = html.replace(/\[UNDERLINE\](.*?)\[\/UNDERLINE\]/g, "<u>$1</u>")
    html = html.replace(/\[SIZE:(\d+)\](.*?)\[\/SIZE\]/g, '<span style="font-size:$1px;">$2</span>')

    // Convert line breaks to paragraphs
    const lines = html.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      return "<p>Start writing in SeekerNotes...</p>"
    }

    return lines.map((line) => `<p>${line}</p>`).join("")
  }

  useImperativeHandle(ref, () => ({
    toggleBold() {
      focusEditor()
      document.execCommand("bold")
    },
    toggleItalic() {
      focusEditor()
      document.execCommand("italic")
    },
    toggleUnderline() {
      focusEditor()
      document.execCommand("underline")
    },
    applyFontSize(size: number) {
      focusEditor()
      document.execCommand("fontSize", false, "7")
      setTimeout(() => normalizeFontTags(size), 10)
    },
    getSntContent() {
      const html = editorRef.current?.innerHTML || ""
      return htmlToSnt(html, fontStyle)
    },
    setSntContent(content: string) {
      if (editorRef.current) {
        editorRef.current.innerHTML = sntToHtml(content)
      }
    },
  }))

  return (
    <main className="flex-1 h-screen overflow-hidden">
      {/* Hover strip to reveal toolbar */}
      <div className="seeker-reveal-zone" />

      <div className="h-full w-full px-4 md:px-10 py-8 overflow-auto">
        <div className="mx-auto max-w-[800px]">
          <div className="seeker-glass rounded-2xl p-6 md:p-10">
            <div
              ref={editorRef}
              role="textbox"
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              onMouseDown={onBodyClick}
              className={cn("min-h-[80vh] outline-none", "text-pretty leading-relaxed")}
              style={{
                fontFamily: family,
                letterSpacing: stylishExtras,
              }}
            >
              <p>
                Start writing in SeekerNotes... Click here to focus. The top bar auto-hides while you write. Hover near
                the top edge to reveal it again.
              </p>
              <p className="mt-4 opacity-80">
                Use the size slider, pick a font style (Normal, Retro, Stylish), and toggle Bold, Italic, or Underline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})
