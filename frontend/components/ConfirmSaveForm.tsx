import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ConfirmSaveFormProps {
    fileName: string
    onConfirm: () => void
    onCancel: () => void
    onDiscard: () => void
    isVisible: boolean
}

export function ConfirmSaveForm({ fileName, onConfirm, onCancel, onDiscard, isVisible }: ConfirmSaveFormProps) {
    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={cn(
                "glass rounded-lg p-6 w-full max-w-md mx-4",
                "bg-white/90 dark:bg-gray-900/90",
                "border border-gray-200/50 dark:border-gray-700/50",
                "shadow-xl"
            )}>
                <div className="text-center">
                    <h3 className={cn(
                        "text-lg font-semibold mb-2",
                        "text-gray-900 dark:text-gray-100"
                    )}>
                        Save changes?
                    </h3>
                    <p className={cn(
                        "text-sm mb-6",
                        "text-gray-600 dark:text-gray-400"
                    )}>
                        Do you want to save changes to "{fileName}" before closing?
                    </p>

                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={onConfirm}
                            className={cn(
                                "px-6 py-2 rounded-md font-medium transition-colors",
                                "bg-purple-600 hover:bg-purple-700 text-white",
                                "dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white"
                            )}
                        >
                            Save
                        </Button>
                        <Button
                            onClick={onDiscard}
                            className={cn(
                                "px-6 py-2 rounded-md font-medium transition-colors",
                                "bg-red-600 hover:bg-red-700 text-white",
                                "dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
                            )}
                        >
                            No
                        </Button>
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className={cn(
                                "px-6 py-2 rounded-md font-medium transition-colors",
                                "bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50",
                                "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            )}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}