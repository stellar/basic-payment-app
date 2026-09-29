/**
 * @module $lib/state/Alert
 * @description Shared, reactive state for a single alert that can be displayed
 * as an informational, success, warning, or error message. When the alert is
 * set, it will be displayed wherever the `<Alert />` component is rendered.
 */

interface IAlert {
    message: string
    type: '' | 'info' | 'success' | 'warning' | 'error'
    title?: string
    dismissible?: boolean
}

export class Alert {
    title: string = $state('')
    message: string = $state('')
    type: '' | 'info' | 'success' | 'warning' | 'error' = $state('')
    dismissible: boolean = $state(true)

    constructor(initAlert: IAlert) {
        this.title = initAlert.title ?? ''
        this.message = initAlert.message
        this.type = initAlert.type
        this.dismissible = initAlert.dismissible ?? true
    }

    setAlert(newAlert: IAlert) {
        this.title = newAlert.title ?? ''
        this.message = newAlert.message
        this.type = newAlert.type
        this.dismissible = newAlert.dismissible ?? true
    }

    clear() {
        this.title = ''
        this.message = ''
        this.type = ''
        this.dismissible = true
    }
}

export const alert = new Alert({ message: '', type: '' })
