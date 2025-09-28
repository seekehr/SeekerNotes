import { IStyle } from "./IStyle";

export class BoldStyle extends IStyle {
    apply(): void {
        document.execCommand('bold', false);
        this.updateState();
    }
    
    private updateState(): void {
        try {
            this.isToggled = !!document.queryCommandState('bold');
        } catch {
            this.isToggled = false;
        }
    }
}

export class ItalicStyle extends IStyle {
    apply(): void {
        document.execCommand('italic', false);
        this.updateState();
    }
    
    private updateState(): void {
        try {
            this.isToggled = !!document.queryCommandState('italic');
        } catch {
            this.isToggled = false;
        }
    }
}

export class UnderlineStyle extends IStyle {
    apply(): void {
        document.execCommand('underline', false);
        this.updateState();
    }
    
    private updateState(): void {
        try {
            this.isToggled = !!document.queryCommandState('underline');
        } catch {
            this.isToggled = false;
        }
    }
}