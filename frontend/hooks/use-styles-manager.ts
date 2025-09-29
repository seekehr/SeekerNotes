import { useState, useEffect, useCallback, useRef } from 'react'

export const STYLE_CONFIG = {
  bold: {
    label: 'Bold',
    keybind: 'ctrl+b',
    htmlTag: 'strong',
    className: 'font-bold',
    execCommand: 'bold'
  },
  italic: {
    label: 'Italic',
    keybind: 'ctrl+i',
    htmlTag: 'em',
    className: 'italic',
    execCommand: 'italic'
  },
  underline: {
    label: 'Underline',
    keybind: 'ctrl+u',
    htmlTag: 'u',
    className: 'underline',
    execCommand: 'underline'
  },
} as const

export type StyleKey = keyof typeof STYLE_CONFIG

export function useStylesManager() {
  const [activeStyles, setActiveStyles] = useState<Set<StyleKey>>(new Set())
  const [fontSize, setFontSize] = useState<number>(16)
  const isTogglingRef = useRef(false)

  const toggleStyle = useCallback((styleKey: StyleKey) => {
    if (isTogglingRef.current) return
    isTogglingRef.current = true

    const config = STYLE_CONFIG[styleKey]
    const selection = window.getSelection()
    
    if (!selection || selection.rangeCount === 0) {
      isTogglingRef.current = false
      return
    }

    const range = selection.getRangeAt(0)

    if (range.collapsed) {
      document.execCommand(config.execCommand, false)
      setTimeout(() => {
        updateActiveStyles()
        isTogglingRef.current = false
      }, 10)
      return
    }

    const selectedText = range.toString()
    if (!selectedText) {
      isTogglingRef.current = false
      return
    }

    const styledParent = findStyledParent(range.startContainer, config.htmlTag)

    if (styledParent && isSelectionFullyInside(range, styledParent)) {
      removeStyleFromSelection(range, styledParent, config, selection)
    } else {
      applyStyleToSelection(range, config, selection)
    }

    setTimeout(() => {
      updateActiveStyles()
      isTogglingRef.current = false
    }, 10)
  }, [])

  const findStyledParent = (node: Node, tagName: string): HTMLElement | null => {
    let current: Node | null = node
    if (current.nodeType === Node.TEXT_NODE) {
      current = current.parentNode
    }
    
    while (current && current !== document.body) {
      if (current.nodeName.toLowerCase() === tagName.toLowerCase()) {
        return current as HTMLElement
      }
      current = current.parentNode
    }
    
    return null
  }

  const isSelectionFullyInside = (range: Range, element: HTMLElement): boolean => {
    const rangeAncestor = range.commonAncestorContainer
    let node: Node | null = rangeAncestor
    
    while (node) {
      if (node === element) return true
      node = node.parentNode
    }
    
    return false
  }

  const removeStyleFromSelection = (
    range: Range,
    styledParent: HTMLElement,
    config: typeof STYLE_CONFIG[StyleKey],
    selection: Selection
  ) => {
    const parentNode = styledParent.parentNode
    if (!parentNode) return

    const fullText = styledParent.textContent || ''
    const selectedText = range.toString()
    
    const startOffset = getTextOffset(styledParent, range.startContainer, range.startOffset)
    const endOffset = startOffset + selectedText.length

    const beforeText = fullText.substring(0, startOffset)
    const afterText = fullText.substring(endOffset)

    const fragment = document.createDocumentFragment()
    let targetNode: Node | null = null

    if (beforeText) {
      const beforeEl = document.createElement(config.htmlTag)
      if (config.className) beforeEl.className = config.className
      beforeEl.textContent = beforeText
      fragment.appendChild(beforeEl)
    }

    const unstyledNode = document.createTextNode(selectedText)
    fragment.appendChild(unstyledNode)
    targetNode = unstyledNode

    if (afterText) {
      const afterEl = document.createElement(config.htmlTag)
      if (config.className) afterEl.className = config.className
      afterEl.textContent = afterText
      fragment.appendChild(afterEl)
    }

    parentNode.replaceChild(fragment, styledParent)

    if (targetNode) {
      const newRange = document.createRange()
      newRange.selectNodeContents(targetNode)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  }

  const getTextOffset = (parent: Node, targetNode: Node, offset: number): number => {
    let totalOffset = 0
    let found = false

    const walk = (node: Node) => {
      if (found) return
      
      if (node === targetNode) {
        totalOffset += offset
        found = true
        return
      }

      if (node.nodeType === Node.TEXT_NODE) {
        totalOffset += node.textContent?.length || 0
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i])
          if (found) return
        }
      }
    }

    walk(parent)
    return totalOffset
  }

  const applyStyleToSelection = (
    range: Range,
    config: typeof STYLE_CONFIG[StyleKey],
    selection: Selection
  ) => {
    const wrapper = document.createElement(config.htmlTag)
    if (config.className) {
      wrapper.className = config.className
    }

    try {
      range.surroundContents(wrapper)
    } catch {
      const contents = range.extractContents()
      wrapper.appendChild(contents)
      range.insertNode(wrapper)
    }

    const newRange = document.createRange()
    newRange.selectNodeContents(wrapper)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }

  const updateActiveStyles = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setActiveStyles(new Set())
      return
    }

    let node = selection.anchorNode
    if (!node) {
      setActiveStyles(new Set())
      return
    }

    const active = new Set<StyleKey>()
    let current: Node | null = node

    while (current && current !== document.body) {
      const tagName = current.nodeName?.toLowerCase()
      
      Object.entries(STYLE_CONFIG).forEach(([key, config]) => {
        if (tagName === config.htmlTag.toLowerCase()) {
          active.add(key as StyleKey)
        }
      })

      current = current.parentNode
    }

    setActiveStyles(active)
  }, [])

  const isStyleActive = useCallback((styleKey: StyleKey) => {
    return activeStyles.has(styleKey)
  }, [activeStyles])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      Object.entries(STYLE_CONFIG).forEach(([key, config]) => {
        if (!config.keybind) return

        const keys = config.keybind.toLowerCase().split('+')
        const needsCtrl = keys.includes('ctrl')
        const needsShift = keys.includes('shift')
        const needsAlt = keys.includes('alt')
        const mainKey = keys[keys.length - 1]

        const ctrlPressed = e.ctrlKey || e.metaKey

        if (
          (!needsCtrl || ctrlPressed) &&
          (!needsShift || e.shiftKey) &&
          (!needsAlt || e.altKey) &&
          e.key.toLowerCase() === mainKey &&
          (needsCtrl || needsShift || needsAlt)
        ) {
          e.preventDefault()
          toggleStyle(key as StyleKey)
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleStyle])

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveStyles)
    window.addEventListener('keyup', updateActiveStyles)
    window.addEventListener('mouseup', updateActiveStyles)

    return () => {
      document.removeEventListener('selectionchange', updateActiveStyles)
      window.removeEventListener('keyup', updateActiveStyles)
      window.removeEventListener('mouseup', updateActiveStyles)
    }
  }, [updateActiveStyles])

  return {
    toggleStyle,
    isStyleActive,
    activeStyles,
    updateActiveStyles,
    fontSize,
    setFontSize
  }
}