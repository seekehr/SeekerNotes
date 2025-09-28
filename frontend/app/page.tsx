"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Topbar } from "@/components/Topbar"
import { Sidebar, type SidebarHandle } from "@/components/Sidebar"
import { TextEditor, type EditorHandle } from "@/components/TextEditor"
import { isOnDesktop, WebSafeConfig } from "@/utils/utils"
import WelcomeSetupForm from "@/components/setup/WelcomeSetupForm"
import { toast } from "@/hooks/use-toast";
import SelectNotesDirForm from "@/components/setup/SelectNotesDirForm"
import { BoldStyle, ItalicStyle, UnderlineStyle } from "@/utils/styles/Styles"
import { LoadAllSntFiles, LoadedFile, createNewNote } from "@/utils/file_manager"
import { initializeTheme } from "@/utils/utils"

type FontStyle = "normal" | "retro" | "stylish"

export default function Page() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showNotesDirForm, setShowNotesDirForm] = useState(false)

  const [configLoaded, setConfigLoaded] = useState<WebSafeConfig | null>(null);
  const [initialFiles, setInitialFiles] = useState<LoadedFile[]>([createNewNote()]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [toolbarPinned, setToolbarPinned] = useState(false)

  const [fontStyle, setFontStyle] = useState<FontStyle>("normal")
  const [fontSize, setFontSize] = useState<number>(16)
  const styles = { bold: new BoldStyle(), italic: new ItalicStyle(), und: new UnderlineStyle() }
  const [characterCount, setCharacterCount] = useState(0)
  const [, forceUpdate] = useState({})

  const editorRef = useRef<EditorHandle | null>(null)
  const sidebarRef = useRef<SidebarHandle | null>(null)

  // Initialize theme first, then load config and files
  useEffect(() => {
    async function initialize() {
      // Initialize theme first
      await initializeTheme();
      
      if (isOnDesktop()) {
        try {
          const { GetConfig } = await import("@/wailsjs/go/main/App");
          const config = await GetConfig();
          setConfigLoaded(config);
          
          // Load all SNT files if config is valid
          if (config.userSelectedDirectory && config.userSelectedDirectory !== "") {
            try {
              const result = await LoadAllSntFiles(config);
              if (result.success && result.files && result.files.length > 0) {
                setInitialFiles(result.files);
              }
            } catch (error) {
              console.error("Failed to load SNT files:", error);
              toast({
                title: "Error loading notes",
                description: "Failed to load existing notes from directory.",
                variant: "destructive",
              });
            }
          }
          
          setShowWelcome(true);
        } catch (error) {
          toast({
            title: "Error fetching config. Error: " + error,
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Not on desktop; skipping welcome form.");
      }
    }

    initialize();
  }, [])


  const updateCharacterCount = useCallback(() => {
    const content = editorRef.current?.getHtmlContent() || ""
    const textContent = content.replace(/<[^>]*>/g, '')
    setCharacterCount(textContent.length)
  }, [])

  // update char count on mount and when editor content changes
  useEffect(() => {
    updateCharacterCount()
  }, [updateCharacterCount])

  // show toolbar
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
      try {
        const boldState = !!document.queryCommandState("bold")
        const italicState = !!document.queryCommandState("italic")
        const underlineState = !!document.queryCommandState("underline")

        styles.bold.setState(boldState)
        styles.italic.setState(italicState)
        styles.und.setState(underlineState)

        // Force re-render to update Topbar
        forceUpdate({})
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
  }, [styles, forceUpdate])

  // hide toolbar when editor is focused
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

    // Update formatting states
    setTimeout(() => {
      try {
        const boldState = !!document.queryCommandState("bold")
        const italicState = !!document.queryCommandState("italic")
        const underlineState = !!document.queryCommandState("underline")

        styles.bold.setState(boldState)
        styles.italic.setState(italicState)
        styles.und.setState(underlineState)

        // Force re-render to update Topbar
        forceUpdate({})
      } catch {
        // ignore
      }
    }, 0)
  }, [updateCharacterCount, styles, forceUpdate])

  const handleWelcomeNext = useCallback(() => {
    setShowWelcome(false)
    setShowNotesDirForm(true)
  }, [])

  const handleSetupComplete = useCallback(() => {
    setShowNotesDirForm(false)
  }, [])

  // Show welcome form if on desktop
  if (showWelcome) {
    // only load welcome form if smth needs initialisation ofc
    if (configLoaded !== null && configLoaded.userSelectedDirectory === "") {
      return <WelcomeSetupForm conf={configLoaded} onNext={handleWelcomeNext} />
    }
  }

  if (showNotesDirForm) {
    if (configLoaded !== null && configLoaded.userSelectedDirectory === "") {
      return <SelectNotesDirForm conf={configLoaded} onComplete={handleSetupComplete} />
    }
  }

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
        styles={styles}
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
          initialFiles={initialFiles}
        />
        <TextEditor ref={editorRef} styles={styles} fontStyle={fontStyle} onBodyClick={handleBodyClick} onContentChange={handleContentChange} />
      </div>
    </div>
  )
}
