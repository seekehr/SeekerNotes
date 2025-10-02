"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  LoadedFile,
  saveSntFile,
  createNewNote,
  handleFileLoad,
  handleFileSave
} from "@/utils/file_manager"
import { htmlToSnt, sntToHtml } from "@/utils/parser"
import { ConfirmSaveForm } from "./ConfirmSaveForm"
import { toggleTheme } from "@/utils/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onLoad: (content: string) => void
  onSave: () => string | Promise<string>
  getCurrentContent?: () => string
  fontStyle: "normal" | "retro" | "stylish"
  characterCount?: number
  onContentChange?: () => void
  initialFiles?: LoadedFile[]
}

export interface SidebarHandle {
  markActiveFileAsUnsaved: () => void
}

export const Sidebar = forwardRef<SidebarHandle, SidebarProps>(function Sidebar({ collapsed, onToggle, onLoad, onSave, getCurrentContent, fontStyle, characterCount = 0, onContentChange, initialFiles }, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>(initialFiles || [createNewNote()])
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(0)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [showConfirmSave, setShowConfirmSave] = useState(false)
  const [fileToClose, setFileToClose] = useState<{ index: number; file: LoadedFile } | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const { toast } = useToast()

  // Mark active file as unsaved when content changes
  const markActiveFileAsUnsaved = () => {
    if (activeFileIndex !== null) {
      setLoadedFiles(prev => prev.map((file, i) => 
        i === activeFileIndex ? { ...file, isSaved: false } : file
      ))
    }
  }

  // Check if current content differs from original
  const hasUnsavedChanges = (fileIndex: number): boolean => {
    if (fileIndex !== activeFileIndex || !getCurrentContent) return false
    
    const file = loadedFiles[fileIndex]
    const currentHtml = getCurrentContent()
    const currentText = currentHtml.replace(/<[^>]*>/g, '')
    const originalText = (file.originalContent || file.content).replace(/<[^>]*>/g, '')
    
    return currentText !== originalText
  }

  // Update loaded files when initialFiles prop changes
  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setLoadedFiles(initialFiles)
      setActiveFileIndex(0)
      // Load the first file's content
      onLoad(initialFiles[0].content)
    }
  }, [initialFiles, onLoad])

  // Track theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  useImperativeHandle(ref, () => ({
    markActiveFileAsUnsaved
  }))

  const handleLoadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const result = await handleFileLoad(file, sntToHtml, loadedFiles)

      if (result.success && result.files && result.loadedFile) {
        setLoadedFiles(result.files)
        setActiveFileIndex(result.index!)
        onLoad(result.loadedFile.content)
        setError(null)
      } else {
        setError(result.error || "Failed to load file")
      }
    }
    // Reset input
    e.target.value = ""
  }

  const handleCloseFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)

    const file = loadedFiles[index]
    
    // Show confirmation dialog if this is the active file and has unsaved changes
    if (activeFileIndex === index && hasUnsavedChanges(index)) {
      setFileToClose({ index, file })
      setShowConfirmSave(true)
    } else {
      // Close immediately if no unsaved changes
      closeFileDirectly(index)
    }
  }

  // Force close a file
  const closeFileDirectly = (index: number) => {
    // Remove file from loaded files
    setLoadedFiles(prev => prev.filter((_, i) => i !== index))

    // Update active file index
    if (activeFileIndex === index) {
      // If closing the active file, switch to the first remaining file or create default
      if (loadedFiles.length > 1) {
        setActiveFileIndex(index === 0 ? 0 : index - 1)
      } else {
        // Create default note if no files left
        const defaultFile = createNewNote()
        setLoadedFiles([defaultFile])
        setActiveFileIndex(0)
        onLoad("")
        return
      }
    } else if (activeFileIndex !== null && activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1)
    }
  }

  // Save file
  const handleConfirmSave = async () => {
    if (!fileToClose || !getCurrentContent) return

    const result = await handleFileSave(fileToClose.file, getCurrentContent, htmlToSnt, fontStyle)

    if (result.success) {
      // Mark file as saved and update original content
      const currentContent = getCurrentContent()
      setLoadedFiles(prev => prev.map((file, i) => 
        i === fileToClose.index ? { 
          ...file, 
          isSaved: true, 
          originalContent: currentContent 
        } : file
      ))
      
      closeFileDirectly(fileToClose.index)
      setShowConfirmSave(false)
      setFileToClose(null)
    } else {
      setError(result.error || "Failed to save file")
      setShowConfirmSave(false)
      setFileToClose(null)
    }
  }

  const handleCancelSave = () => {
    setShowConfirmSave(false)
    setFileToClose(null)
  }

  const handleDiscardChanges = () => {
    if (!fileToClose) return

    // Close the file without saving
    closeFileDirectly(fileToClose.index)
    setShowConfirmSave(false)
    setFileToClose(null)
  }

  const handleSaveClick = async () => {
    const content = await onSave()
    const activeFile = activeFileIndex !== null ? loadedFiles[activeFileIndex] : null
    const fileName = activeFile?.name || `notes-${Date.now()}`

    const result = await saveSntFile(undefined, content, fileName)

    if (result.success && activeFileIndex !== null && getCurrentContent) {
      // Mark active file as saved and update original content
      const currentContent = getCurrentContent()
      setLoadedFiles(prev => prev.map((file, i) => 
        i === activeFileIndex ? { 
          ...file, 
          isSaved: true, 
          originalContent: currentContent 
        } : file
      ))
    } else if (!result.success) {
      setError(result.error || "Failed to save file")
    }
  }

  const handleNewNote = () => {
    const newFile = createNewNote()
    setLoadedFiles(prev => [...prev, newFile])
    const newIndex = loadedFiles.length
    setActiveFileIndex(newIndex)
    onLoad("")
  }

  const handleNameEdit = (index: number, newName: string) => {
    const trimmedName = newName.trim()
    
    if (trimmedName === "") {
      newName = "New Note"
    }

    // Check if a note with the same name already exists (excluding the current note being edited)
    const duplicateExists = loadedFiles.some((file, i) => 
      i !== index && file.name === trimmedName
    )

    if (duplicateExists) {
      toast({
        title: "Duplicate Name",
        description: `A note with the name "${trimmedName}" already exists.`,
        variant: "destructive",
      })
      
      // Revert to "New Note" if duplicate found
      setLoadedFiles(prev => prev.map((file, i) =>
        i === index ? { ...file, name: "New Note", isEditing: false } : file
      ))
    } else {
      setLoadedFiles(prev => prev.map((file, i) =>
        i === index ? { ...file, name: trimmedName || "New Note", isEditing: false } : file
      ))
    }
    
    setEditingName("")
  }

  const handleNameKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      handleNameEdit(index, editingName)
    }
  }

  const startEditing = (index: number, currentName: string) => {
    setLoadedFiles(prev => prev.map((file, i) =>
      i === index ? { ...file, isEditing: true } : file
    ))
    setEditingName(currentName)
  }

  const handleThemeToggle = async () => {
    await toggleTheme()
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
          <div className={cn("flex items-center gap-2", collapsed ? "sr-only" : "")}>
            <div className="text-sm font-medium">Notes</div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleThemeToggle}
              aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
              className="h-6 w-6 p-0 bg-transparent border-none hover:bg-accent/30 dark:hover:bg-purple-500/30 transition-colors"
            >
              {isDarkTheme ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </Button>
          </div>
          <div className={cn("flex", collapsed ? "flex-col gap-1" : "gap-1")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (collapsed) {
                  onToggle()
                }
                handleNewNote()
              }}
              aria-label="Create new note"
              className="h-8 w-8 p-0 bg-transparent"
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-8 w-8 p-0 bg-transparent"
            >
              {collapsed ? "»" : "«"}
            </Button>
          </div>
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

          <nav className={cn("flex flex-col gap-1", collapsed && "hidden")}>
            {loadedFiles.map((file, i) => (
              <div
                key={i}
                className={cn(
                  "relative group rounded-md",
                  activeFileIndex === i && !collapsed && "border-2 border-white/60 dark:border-gray-600/60"
                )}
              >
                {file.isEditing && !collapsed ? (
                  <div className="px-3 py-2 pr-8">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleNameEdit(i, editingName)}
                      onKeyDown={(e) => handleNameKeyDown(e, i)}
                      className="w-full bg-transparent border-b border-white/30 focus:border-white/60 outline-none text-sm"
                      autoFocus
                    />
                    <div className="text-xs opacity-60 mt-1">{characterCount} chars</div>
                  </div>
                ) : (
                  <button
                    className={cn(
                      "text-left w-full rounded-md px-3 py-2 pr-8 transition-colors",
                      !collapsed && "hover:bg-[var(--color-accent)]/30 dark:hover:bg-purple-500/20",
                      activeFileIndex === i && "bg-transparent"
                    )}
                    title={file.name}
                    onClick={() => {
                      if (!file.isEditing) {
                        setActiveFileIndex(i)
                        onLoad(file.content)
                        setError(null)
                      }
                    }}
                    onDoubleClick={() => !collapsed && startEditing(i, file.name)}
                  >
                    <div className={cn("truncate", collapsed ? "sr-only" : "")}>
                      {(activeFileIndex === i && hasUnsavedChanges(i)) ? "*" : ""}{collapsed ? file.name : (file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name)}
                    </div>
                    {!collapsed && <div className="text-xs opacity-60">{activeFileIndex === i ? characterCount : file.content.replace(/<[^>]*>/g, '').length} chars</div>}
                  </button>
                )}

                {!collapsed && (
                  <button
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-transparent hover:bg-red-500/20 text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                    onClick={(e) => handleCloseFile(i, e)}
                    title="Close file"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className={cn("pt-2 space-y-2", collapsed && "hidden")}>
          <Button className="w-full bg-transparent" variant="outline" onClick={handleLoadClick}>
            {collapsed ? "↑" : "Load"}
          </Button>

          <Button className="w-full bg-transparent" variant="outline" onClick={handleSaveClick}>
            {collapsed ? "💾" : "Save"}
          </Button>
        </div>
      </div>

      {/* Hidden file input for .snt files */}
      <input ref={fileInputRef} type="file" accept=".snt" onChange={handleFileChange} className="hidden" />
      
      {/* Confirmation dialog */}
      <ConfirmSaveForm
        fileName={fileToClose?.file.name || ""}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        onDiscard={handleDiscardChanges}
        isVisible={showConfirmSave}
      />
    </aside>
  )
})
