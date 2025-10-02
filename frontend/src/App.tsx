import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Topbar } from "@/components/Topbar"
import { Sidebar, type SidebarHandle } from "@/components/Sidebar"
import { TextEditor, type EditorHandle } from "@/components/TextEditor"
import { isOnDesktop, WebSafeConfig } from "@/utils/utils"
import WelcomeSetupForm from "@/components/setup/WelcomeSetupForm"
import { toast } from "@/hooks/use-toast"
import SelectNotesDirForm from "@/components/setup/SelectNotesDirForm"
import { LoadAllSntFiles, LoadedFile, createNewNote } from "@/utils/file_manager"
import { initializeTheme } from "@/utils/utils"
import { useToolbarHandler } from "@/hooks/use-handle-toolbar"
import { useStylesManager } from "@/hooks/use-styles-manager"
import { useFontSizeManager } from "@/hooks/use-font-size-manager"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

type FontStyle = "normal" | "retro" | "stylish"

function App() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showNotesDirForm, setShowNotesDirForm] = useState(false)

  const [configLoaded, setConfigLoaded] = useState<WebSafeConfig | null>(null);
  const [initialFiles, setInitialFiles] = useState<LoadedFile[]>([createNewNote()]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toolbarPinned, setToolbarPinned] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useToolbarHandler(toolbarPinned)

  const [fontStyle, setFontStyle] = useState<FontStyle>("normal")
  const stylesManager = useStylesManager()
  const fontSizeManager = useFontSizeManager()
  const [characterCount, setCharacterCount] = useState(0)

  const editorRef = useRef<EditorHandle | null>(null)
  const sidebarRef = useRef<SidebarHandle | null>(null)

  useEffect(() => {
    async function initialize() {
      await initializeTheme();
      
      if (isOnDesktop()) {
        try {
          const { GetConfig } = await import("@/wailsjs/go/main/App");
          const config = await GetConfig();
          setConfigLoaded(config);
          
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

  useEffect(() => {
    updateCharacterCount()
  }, [updateCharacterCount])

  const handleLoad = useCallback((content: string) => {
    editorRef.current?.setSntContent(content)

    const fontMatch = content.match(/^\[FONT:([^\]]+)\]/)
    if (fontMatch) {
      const fontName = fontMatch[1]
      if (fontName === "FIRA_CODE") setFontStyle("retro")
      else if (fontName === "GEIST_STYLISH") setFontStyle("stylish")
      else setFontStyle("normal")
    }

    setTimeout(updateCharacterCount, 0)
  }, [updateCharacterCount])

  const handleBodyClick = useCallback(() => {
    if (!toolbarPinned) setToolbarVisible(false)
  }, [toolbarPinned, setToolbarVisible])

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

  const handleWelcomeNext = useCallback(() => {
    setShowWelcome(false)
    setShowNotesDirForm(true)
  }, [])

  const handleSetupComplete = useCallback(() => {
    setShowNotesDirForm(false)
  }, [])

  if (showWelcome) {
    if (configLoaded !== null && configLoaded.userSelectedDirectory === "") {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="antialiased font-sans">
            <WelcomeSetupForm conf={configLoaded} onNext={handleWelcomeNext} />
            <Toaster />
          </div>
        </ThemeProvider>
      )
    }
  }

  if (showNotesDirForm) {
    if (configLoaded !== null && configLoaded.userSelectedDirectory === "") {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="antialiased font-sans">
            <SelectNotesDirForm conf={configLoaded} onComplete={handleSetupComplete} />
            <Toaster />
          </div>
        </ThemeProvider>
      )
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="antialiased font-sans">
        <div className={cn("h-screen gradient-bg flex flex-col")}>
          <Topbar
            visible={toolbarVisible}
            pinned={toolbarPinned}
            onTogglePinned={() => setToolbarPinned((p) => !p)}
            fontStyle={fontStyle}
            onFontStyleChange={setFontStyle}
            stylesManager={stylesManager}
            fontSizeManager={fontSizeManager}
            onToggleStyle={(key) => editorRef.current?.toggleStyle(key)}
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
            <TextEditor 
              ref={editorRef} 
              fontStyle={fontStyle} 
              onBodyClick={handleBodyClick} 
              onContentChange={handleContentChange}
              stylesManager={stylesManager}
              fontSizeManager={fontSizeManager}
            />
          </div>
        </div>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App