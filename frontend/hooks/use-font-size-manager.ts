import { useState, useCallback, useRef } from 'react'

export function useFontSizeManager() {
  const [fontSize, setFontSize] = useState < number > (16)
  const processingRef = useRef(false)

  const applyFontSize = useCallback((size: number) => {
    // Add a guard to prevent server-side execution
    if (typeof window === 'undefined' || processingRef.current) return
    
    processingRef.current = true
    setFontSize(size)

    const selection = window.getSelection()
    if (!selection?.rangeCount) {
      processingRef.current = false
      return
    }

    const range = selection.getRangeAt(0)

    if (range.collapsed) {
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`
      span.textContent = '\u200B'
      range.insertNode(span)
      range.setStart(span.firstChild!, 1)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      processingRef.current = false
      return
    }

    const selectedText = range.toString()
    if (!selectedText) {
      processingRef.current = false
      return
    }

    const wrapper = document.createElement('span')
    wrapper.style.fontSize = `${size}px`

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

    processingRef.current = false
  }, [])

  const getCurrentFontSize = useCallback((): number => {
    // Add a guard to prevent server-side execution
    if (typeof window === 'undefined') {
      return fontSize // Return default state on the server
    }

    const selection = window.getSelection()
    if (!selection?.rangeCount) return fontSize

    let node = selection.anchorNode
    if (!node) return fontSize

    let current: Node | null = node
    while (current && current !== document.body) {
      if (current instanceof HTMLElement && current.style.fontSize) {
        const size = parseInt(current.style.fontSize)
        if (size) return size
      }
      current = current.parentNode
    }

    return fontSize
  }, [fontSize])

  return {
    fontSize,
    setFontSize,
    applyFontSize,
    getCurrentFontSize
  }
}