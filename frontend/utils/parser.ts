import { forwardRef, useImperativeHandle, useRef, RefObject } from "react"
import { cn } from "@/lib/utils"

export type FontStyle = "normal" | "retro" | "stylish"

export const htmlToSnt = (html: string, currentFontStyle: FontStyle): string => {
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

export const sntToHtml = (snt: string): string => {
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

export const normalizeFontTags = (px: number, editorRef: RefObject<HTMLDivElement>) => {
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
  

export const applyFormatting = (tag: string, style?: string) => {
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    const selectedText = range.toString()
    const element = document.createElement(tag)
    if (style) element.setAttribute('style', style)
    element.textContent = selectedText

    range.deleteContents()
    range.insertNode(element)
    selection.removeAllRanges()
}