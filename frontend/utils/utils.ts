
export function isOnDesktop(): boolean {
    // @ts-expect-error
     return typeof window.runtime !== "undefined";
}
