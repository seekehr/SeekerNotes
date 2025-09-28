// ONLY FOR COMPATIBILITY REASONS. WEB VERSION DOES NOT HAVE ANY CONFIG.
export interface WebSafeConfig {
    userSelectedDirectory: string;
    theme: string;
}

export function isOnDesktop(): boolean {
    // @ts-expect-error
    return typeof window.runtime !== "undefined";
}

export async function toggleTheme(): Promise<void> {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update DOM
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Save to config if on desktop
    if (isOnDesktop()) {
        try {
            const { GetConfig, SaveConfig } = await import("../wailsjs/go/main/App");
            const config = await GetConfig();
            config.theme = newTheme;
            await SaveConfig(config);
        } catch (error) {
            console.error("Failed to save theme config:", error);
        }
    }
}

export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
    // Update DOM
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function getCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export async function initializeTheme(): Promise<void> {
    if (isOnDesktop()) {
        try {
            const { GetConfig } = await import("../wailsjs/go/main/App");
            const config = await GetConfig();
            if (config.theme) {
                await setTheme(config.theme as 'light' | 'dark');
            }
        } catch (error) {
            console.error("Failed to load theme config:", error);
            // Default to light theme
            await setTheme('light');
        }
    } else {
        // Default to light theme for web
        await setTheme('light');
    }
}
