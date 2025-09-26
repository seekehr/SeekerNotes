"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Topbar } from "@/components/Navbar"
import { Sidebar, type SidebarHandle } from "@/components/Sidebar"
import { TextEditor, type EditorHandle } from "@/components/TextEditor"
import { htmlToSnt, sntToHtml } from "@/utils/parser"

type FontStyle = "normal" | "retro" | "stylish"

export default function Page() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [toolbarPinned, setToolbarPinned] = useState(false)

  const [fontStyle, setFontStyle] = useState<FontStyle>("normal")
  const [fontSize, setFontSize] = useState<number>(16)
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [underline, setUnderline] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)

  const editorRef = useRef<EditorHandle | null>(null)
  const sidebarRef = useRef<SidebarHandle | null>(null)

  const updateCharacterCount = useCallback(() => {
    const content = editorRef.current?.getHtmlContent() || ""
    const textContent = content.replace(/<[^>]*>/g, '')
    setCharacterCount(textContent.length)
  }, [])

  // Update character count on mount and when editor content changes
  useEffect(() => {
    updateCharacterCount()
  }, [updateCharacterCount])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (toolbarPinned) return
      const nearTop = e.clientY <= 48
      setToolbarVisible(nearTop)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [toolbarPinned])

  useEffect(() => {
    const updateStates = () => {
      const doc: any = document as any
      try {
        setBold(!!doc?.queryCommandState?.("bold"))
        setItalic(!!doc?.queryCommandState?.("italic"))
        setUnderline(!!doc?.queryCommandState?.("underline"))
      } catch {
        // ignore
      }
    }
    document.addEventListener("selectionchange", updateStates)
    window.addEventListener("keyup", updateStates)
    window.addEventListener("mouseup", updateStates)
    return () => {
      document.removeEventListener("selectionchange", updateStates)
      window.removeEventListener("keyup", updateStates)
      window.removeEventListener("mouseup", updateStates)
    }
  }, [])

  const handleBodyClick = useCallback(() => {
    if (!toolbarPinned) setToolbarVisible(false)
  }, [toolbarPinned])

  const handleLoad = useCallback((content: string) => {
    editorRef.current?.setSntContent(content)

    // Extract font style from content
    const fontMatch = content.match(/^\[FONT:([^\]]+)\]/)
    if (fontMatch) {
      const fontName = fontMatch[1]
      if (fontName === "FIRA_CODE") setFontStyle("retro")
      else if (fontName === "GEIST_STYLISH") setFontStyle("stylish")
      else setFontStyle("normal")
    }

    // Update character count after loading
    setTimeout(updateCharacterCount, 0)
  }, [updateCharacterCount])

  const handleSave = useCallback(async () => {
    return editorRef.current?.getSntContent() || ""
  }, [])

  const handleGetCurrentContent = useCallback(() => {
    return editorRef.current?.getHtmlContent() || ""
  }, [])

  const handleContentChange = useCallback(() => {
    updateCharacterCount()
    sidebarRef.current?.markActiveFileAsUnsaved()
  }, [updateCharacterCount])

  return (
    <div className={cn("h-screen gradient-bg flex flex-col")}>
      <Topbar
        visible={toolbarVisible}
        pinned={toolbarPinned}
        onTogglePinned={() => setToolbarPinned((p) => !p)}
        fontStyle={fontStyle}
        onFontStyleChange={setFontStyle}
        fontSize={fontSize}
        onFontSizeChange={(n) => {
          setFontSize(n)
          editorRef.current?.applyFontSize(n)
        }}
        bold={bold}
        italic={italic}
        underline={underline}
        onToggleBold={() => editorRef.current?.toggleBold()}
        onToggleItalic={() => editorRef.current?.toggleItalic()}
        onToggleUnderline={() => editorRef.current?.toggleUnderline()}
      />

      <div className="flex flex-1 h-full min-h-0">
        <Sidebar
          ref={sidebarRef}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onLoad={handleLoad}
          onSave={handleSave}
          getCurrentContent={handleGetCurrentContent}
          fontStyle={fontStyle}
          characterCount={characterCount}
          onContentChange={handleContentChange}
        />
        <TextEditor ref={editorRef} fontStyle={fontStyle} onBodyClick={handleBodyClick} onContentChange={handleContentChange} />
      </div>
    </div>
  )
}
