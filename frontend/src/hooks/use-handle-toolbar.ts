import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * Handles the toolbar's visibility
 * @param toolbarPinned State
 * @param threshold Y-axis for toolbar to render
 * @param throttleMs To prevent React re-rendering too often
 * @returns [toolbarVisible, setToolbarVisible] - Getter and setter of toolbar visibility state
 */
export function useToolbarHandler(toolbarPinned: boolean, threshold = 48, throttleMs = 50): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [toolbarVisible, setToolbarVisible] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    function onMove(e: MouseEvent) {
      if (toolbarPinned) return;

      if (timeout) return; // throttle
      timeout = setTimeout(() => {
        const nearTop = e.clientY <= threshold;
        setToolbarVisible(nearTop);
        timeout = null;
      }, throttleMs);
    }

    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (timeout) clearTimeout(timeout);
    };
  }, [toolbarPinned, threshold, throttleMs]);

  return [toolbarVisible, setToolbarVisible];
}
