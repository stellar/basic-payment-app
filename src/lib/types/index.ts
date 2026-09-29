/**
 * The functions our modal library (`svelte-simple-modal`) shares with our
 * components through Svelte's context. The library doesn't come with
 * TypeScript types, so we describe the parts we use here.
 *
 * ```ts
 * const { open, close } = getContext<ModalContext>('simple-modal')
 * ```
 */
export interface ModalContext {
    /** Opens a modal window that displays the given component, with the given props */
    open: (component: unknown, props?: Record<string, unknown>) => void
    /** Closes the modal window. `onClosed` runs once the window is gone. */
    close: (callbacks?: { onClose?: () => void; onClosed?: () => void }) => void
}
