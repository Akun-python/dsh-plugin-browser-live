/** Slot declarations for the installed shell overlay position. */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * Floating overlay contributions rendered by the installed shell layout at
     * root scope (bottom-right floating panels). Declared by the installed
     * app's layout at runtime; this checkout's layout does not declare the
     * position, so this package restores the name for its own registration.
     */
    'shell.overlay': { kind: 'list'; scope: 'root' }
  }
}

export {}