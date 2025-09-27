import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { GetStorage, SaveStorage } from "@/utils/storage_utils";
import { OpenFolderDialog } from "@/wailsjs/go/main/App";
import * as WailsRuntime from "@/wailsjs/runtime";
import { toast } from "@/hooks/use-toast";
import {config} from "@/wailsjs/go/models";

interface SelectNotesDirFormProps {
  conf: config.Config  
  onComplete: () => void;
}

// DESKTOP-ONLY.
const SelectNotesDirForm = ({conf, onComplete }: SelectNotesDirFormProps) => {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const folder = await OpenFolderDialog();
      setSelectedPath(folder)
    } catch (error) {
      WailsRuntime.LogError("Error selecting folder: " + error);
      toast({
        title: "Error selecting folder",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!selectedPath.trim()) return;
    
    setIsLoading(true);
    
    try {
        conf.userSelectedDirectory = selectedPath;
        await SaveStorage(conf);
    } catch (error) {
      WailsRuntime.LogError("Error fetching/saving config:" + error);
      toast({
        title: "Error fetching/saving config",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
    
    // Simulate saving process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
    onComplete();
  };

  const isConfirmDisabled = !selectedPath.trim() || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass-card p-12 text-center max-w-lg w-full animate-fade-in">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Select Notes Directory
            </h1>
            <p className="text-muted-foreground">
              Choose where you'd like to store your notes
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Input
                  value={selectedPath || "/"}
                  readOnly
                  className="glass-input text-left font-mono text-sm bg-muted/30 cursor-not-allowed"
                  placeholder="Select a folder..."
                />
              </div>
              <Button
                onClick={handleSelectFolder}
                variant="outline"
                size="icon"
                className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-200"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 w-full ${
              isConfirmDisabled 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "gradient-button"
            }`}
          >
            {isLoading ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SelectNotesDirForm;