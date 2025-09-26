"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRef, useState } from "react"
import { htmlToSnt, sntToHtml } from "@/utils/parser"

interface LoadedFile {
  name: string
  content: string
  htmlContent: string
  filePath?: string
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onLoad: (content: string) => void
  onSave: () => string | Promise<string>
  getCurrentContent?: () => string
}

export function Sidebar({ collapsed, onToggle, onLoad, onSave, getCurrentContent }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([])
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLoadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".snt")) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        if (content) {
          const htmlContent = sntToHtml(content)
          const newFile: LoadedFile = {
            name: file.name.replace('.snt', ''),
            content,
            htmlContent,
            filePath: file.name
          }
          
          // Add to loaded files if not already present
          setLoadedFiles(prev => {
            const existingIndex = prev.findIndex(f => f.name === newFile.name)
            if (existingIndex !== -1) {
              setActiveFileIndex(existingIndex)
              return prev
            }
            const newIndex = prev.length
            setActiveFileIndex(newIndex)
            return [...prev, newFile]
          })
          
          onLoad(content)
        }
      }
      reader.readAsText(file)
    }
    // Reset input
    e.target.value = ""
  }

  const handleCloseFile = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    
    const fileToClose = loadedFiles[index]
    
    // Auto-save current content if this is the active file
    if (activeFileIndex === index && getCurrentContent) {
      try {
        const currentHtml = getCurrentContent()
        const sntContent = htmlToSnt(currentHtml, "normal")
        
        // Check if original file exists by trying to create a file handle
        const fileName = fileToClose.filePath || `${fileToClose.name}.snt`
        
        try {
          // Auto-save the file
          const blob = new Blob([sntContent], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch (saveError) {
          setError(`Failed to save file "${fileName}": File may not exist or is inaccessible`)
          return // Don't close the file if save failed
        }
      } catch (error) {
        setError(`Failed to convert content for "${fileToClose.name}": ${error}`)
        return // Don't close the file if conversion failed
      }
    }
    
    // Remove file from loaded files
    setLoadedFiles(prev => prev.filter((_, i) => i !== index))
    
    // Update active file index
    if (activeFileIndex === index) {
      setActiveFileIndex(null)
    } else if (activeFileIndex !== null && activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1)
    }
  }

  const handleSaveClick = async () => {
    const content = await onSave()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notes-${Date.now()}.snt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <aside
      className={cn(
        "relative z-20 h-full transition-[width] duration-300 ease-out",
        collapsed ? "w-[64px]" : "w-[260px]",
      )}
      aria-label="Navigation"
    >
      <div className="glass h-full rounded-r-xl p-3 flex flex-col">
        <div className="flex items-center justify-between">
          <div className={cn("text-sm font-medium", collapsed ? "sr-only" : "")}>Notes</div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-8 bg-transparent"
          >
            {collapsed ? "»" : "«"}
          </Button>
        </div>

        <div className="mt-3 flex-1 overflow-auto">
          {error && !collapsed && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-md text-xs text-red-200">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-red-100"
              >
                ×
              </button>
            </div>
          )}
          
          <nav className="flex flex-col gap-1">
            {loadedFiles.map((file, i) => (
              <div
                key={i}
                className={cn(
                  "relative group rounded-md transition-all duration-200",
                  activeFileIndex === i && "bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg scale-[1.02] z-10"
                )}
              >
                <button
                  className={cn(
                    "text-left w-full rounded-md px-3 py-2 pr-8 transition-colors",
                    "hover:bg-[var(--color-accent)]/30",
                    activeFileIndex === i && "bg-transparent text-white"
                  )}
                  title={file.name}
                  onClick={() => {
                    setActiveFileIndex(i)
                    onLoad(file.content)
                    setError(null)
                  }}
                >
                  <div className={cn("truncate", collapsed ? "sr-only" : "")}>{file.name}</div>
                  {!collapsed && <div className="text-xs opacity-60">.snt file</div>}
                </button>
                
                {!collapsed && (
                  <button
                    className={cn(
                      "absolute top-1 right-1 w-5 h-5 rounded-full",
                      "bg-red-500/80 hover:bg-red-600 text-white text-xs",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "flex items-center justify-center font-bold"
                    )}
                    onClick={(e) => handleCloseFile(i, e)}
                    title="Close and auto-save"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-2 space-y-2">
          <Button className="w-full bg-transparent" variant="outline" onClick={handleLoadClick}>
            {collapsed ? "↑" : "Load"}
          </Button>

          <Button className="w-full bg-transparent" variant="outline" onClick={handleSaveClick}>
            {collapsed ? "💾" : "Save"}
          </Button>

          {loadedFiles.length === 0 && (
            <Button className="w-full bg-transparent" variant="outline">
              {collapsed ? "+" : "New Note"}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input for .snt files */}
      <input ref={fileInputRef} type="file" accept=".snt" onChange={handleFileChange} className="hidden" />
    </aside>
  )
}
