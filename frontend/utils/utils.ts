// ONLY FOR COMPATIBILITY REASONS. WEB VERSION DOES NOT HAVE ANY CONFIG.
export interface WebSafeConfig {
    userSelectedDirectory: string;
    theme: string;
}

export function isOnDesktop(): boolean {
    // @ts-expect-error
    return typeof window.runtime !== "undefined";
}
