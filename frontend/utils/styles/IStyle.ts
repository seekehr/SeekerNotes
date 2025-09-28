export abstract class IStyle {
  protected isToggled = false;
  abstract apply(): void;
  
  getState(): boolean {
    return this.isToggled;
  }
  
  setState(state: boolean): void {
    this.isToggled = state;
  }
  
  protected applyFormatting(tag: string, style: string|null) {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      const element = document.createElement(tag)
      if (style) element.setAttribute('style', style)
    
      // Place the cursor inside the element
      range.insertNode(element)
    
      const newRange = document.createRange()
      newRange.setStart(element, 0) // caret inside element
      newRange.collapse(true)
    
      selection.removeAllRanges()
      selection.addRange(newRange)
      return
    }
    

    const selectedText = range.toString()
    const element = document.createElement(tag)
    if (style) element.setAttribute('style', style)
    element.textContent = selectedText

    range.deleteContents()
    range.insertNode(element)
  }
}
