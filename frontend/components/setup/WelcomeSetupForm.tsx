import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { GetConfig, SaveConfig } from "@/wailsjs/go/main/App";
import { config } from "@/wailsjs/go/models";
import * as WailsRuntime from "@/wailsjs/runtime";
import { toast } from "@/hooks/use-toast";

interface WelcomeSetupFormProps {
  conf: config.Config 
  onNext: () => void;
}

// DESKTOP-ONLY.
const WelcomeSetupForm = ({ conf, onNext }: WelcomeSetupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLetsGo = async () => {
    setIsLoading(true);
    
    try {
         // Simulate brief loading for better UX
         await new Promise(resolve => setTimeout(resolve, 300));
         setIsLoading(false);
 
         // no directory set
         if (conf.userSelectedDirectory === "" || conf.userSelectedDirectory === "/") {
             WailsRuntime.LogInfo('Notes directory not configured, showing dir form');
             onNext(); // Show SelectNotesDirForm
         } else {
             // Notes directory already set, continue to main app
             WailsRuntime.LogInfo('Notes directory already configured');
         }
    } catch (error) {
        WailsRuntime.LogFatal("Error fetching config:" + error);
        toast({
            title: "Error fetching config",
            description: "Please try again later.",
            variant: "destructive",
        });
        return
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass-card p-12 text-center max-w-md w-full animate-fade-in">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Welcome to
            </h1>
            <h2 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              SeekerNotes
            </h2>
          </div>
          
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your intelligent note-taking companion for organizing thoughts and ideas beautifully.
          </p>
          
          <Button
            onClick={handleLetsGo}
            disabled={isLoading}
            className="gradient-button px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 w-full"
          >
            {isLoading ? "Setting up..." : "Let's Go"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WelcomeSetupForm;