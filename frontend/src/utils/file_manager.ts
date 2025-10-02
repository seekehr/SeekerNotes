import { isOnDesktop, WebSafeConfig } from "./utils"

export interface LoadedFile {
    name: string
    content: string
    htmlContent: string
    filePath?: string
    isEditing?: boolean
    isSaved?: boolean
    originalContent?: string
}

export interface FileOperationResult {
    success: boolean
    error?: string
    file?: LoadedFile
    content?: string
}

const DO_NOT_AUTO_SAVE_NAME = "New Note"

/**
 * Load a .SNT file from the file system. Returns raw content (that needs to be converted to HTML)
 */
export const loadSntFile = (file: File): Promise<FileOperationResult> => {
    return new Promise((resolve) => {
        if (!file.name.endsWith(".snt")) {
            resolve({ success: false, error: "File must have a .snt extension" })
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            if (content) {
                resolve({
                    success: true,
                    content,
                    file: {
                        name: file.name.replace('.snt', ''),
                        content,
                        htmlContent: "", // Will be set by caller
                        filePath: file.name
                    }
                })
            } else {
                resolve({ success: false, error: "Failed to read file content" })
            }
        }
        reader.onerror = () => {
            resolve({ success: false, error: "Failed to read file" })
        }
        reader.readAsText(file)
    })
}

/**
 * Save content as a .snt file. TODO: make sidebar pass config to this
 */
export const saveSntFile = async (conf: WebSafeConfig | undefined, content: string, fileName: string): Promise<FileOperationResult> => {
    try {
        // Check if we're on desktop first

        if (isOnDesktop()) {
            // Use desktop save functionality
            const { SaveFileOnDesktop, GetConfig } = await import("../../wailsjs/go/main/App")
            if (conf === undefined) {
                conf = await GetConfig()
            }

            await SaveFileOnDesktop(conf, content, fileName)
            return { success: true }
        } else {
            // Use web save functionality (download)
            const blob = new Blob([content], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = fileName.endsWith('.snt') ? fileName : `${fileName}.snt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            return { success: true }
        }
    } catch (error) {
        return { success: false, error: `Failed to save file: ${error}` }
    }
}

/**
 * Auto-save a file with .SNT content
 */
export const autoSaveFile = async (
    fileName: string,
    sntContent: string
): Promise<FileOperationResult> => {
    try {
        return await saveSntFile(undefined, sntContent, fileName)
    } catch (error) {
        return { success: false, error: `Failed to save file "${fileName}": ${error}` }
    }
}

/**
 * Load all .SNT files from the configured directory
 */
export const LoadAllSntFiles = async (conf?: WebSafeConfig): Promise<FileOperationResult & { files?: LoadedFile[] }> => {
    try {
        if (isOnDesktop()) {
            // Use desktop functionality to load all files from directory
            const { LoadSNTsFromDir, GetConfig } = await import("../../wailsjs/go/main/App")

            if (conf === undefined) {
                conf = await GetConfig()
            }

            const fileDataArray = await LoadSNTsFromDir(conf)

            // Convert the Go FileData structs to LoadedFile objects
            const loadedFiles: LoadedFile[] = fileDataArray.map((fileData: any) => ({
                name: fileData.name.replace('.snt', ''), // Remove .snt extension for display
                content: fileData.content,
                htmlContent: fileData.htmlContent || "", // Use provided HTML or empty string
                filePath: fileData.name,
                isSaved: true,
                originalContent: fileData.content
            }))

            return { success: true, files: loadedFiles }
        } else {
            // Web version doesn't have directory access, return empty array
            return { success: true, files: [] }
        }
    } catch (error) {
        return { success: false, error: `Failed to load files from directory: ${error}` }
    }
}

/**
 * Create a new default note
 */
export const createNewNote = (name: string = "New Note"): LoadedFile => {
    return {
        name,
        content: "",
        htmlContent: "",
        isSaved: true,
        originalContent: ""
    }
}

/**
 * Update the sidebar by adding a new file or overwriting an existing one with the same name
 */
export const updateFileList = (
    files: LoadedFile[],
    newFile: LoadedFile
): { files: LoadedFile[], index: number } => {
    const existingIndex = files.findIndex(f => f.name === newFile.name)

    if (existingIndex !== -1) {
        // Overwrite the existing file with the new file's content
        const updatedFiles = files.map((file, index) =>
            index === existingIndex ? newFile : file
        )
        return { files: updatedFiles, index: existingIndex }
    }

    const newFiles = [...files, newFile]
    return { files: newFiles, index: newFiles.length - 1 }
}

/**
 * Helper handling function for loading a .SNT file
 */
export const handleFileLoad = async (
    file: File,
    sntToHtml: (content: string) => string,
    loadedFiles: LoadedFile[]
): Promise<{ success: boolean, error?: string, loadedFile?: LoadedFile, files?: LoadedFile[], index?: number }> => {
    const result = await loadSntFile(file)

    if (result.success && result.file && result.content) {
        // Parse the SNT content to HTML
        const htmlContent = sntToHtml(result.content)
        const loadedFile: LoadedFile = {
            ...result.file,
            htmlContent,
            isSaved: true,
            originalContent: result.content
        }

        const { files, index } = updateFileList(loadedFiles, loadedFile)
        return { success: true, loadedFile, files, index }
    } else {
        return { success: false, error: result.error || "Failed to load file" }
    }
}

/**
 * Handle file saving when user confirms
 */
export const handleFileSave = async (
    fileToSave: LoadedFile,
    getCurrentContent: () => string,
    htmlToSnt: (html: string, fontStyle: "normal" | "retro" | "stylish") => string,
    fontStyle: "normal" | "retro" | "stylish"
): Promise<{ success: boolean, error?: string }> => {
    try {
        if (fileToSave.name === DO_NOT_AUTO_SAVE_NAME) {
            return { success: true }
        }

        const currentHtml = getCurrentContent()
        const sntContent = htmlToSnt(currentHtml, fontStyle)
        const fileName = fileToSave.filePath || `${fileToSave.name}.snt`

        const result = await autoSaveFile(fileName, sntContent)

        if (!result.success) {
            return { success: false, error: result.error || "Failed to save file" }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: `Failed to convert content for "${fileToSave.name}": ${error}` }
    }
}
