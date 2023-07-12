<script>
    import SidebarMenu from './SidebarMenu.svelte'
    // import { errorMessage } from '$lib/stores/alertsStore'
    import ErrorAlert from '$lib/components/ErrorAlert.svelte'
</script>

<div class="drawer grow lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <main class="prose max-w-full p-6">
            <ErrorAlert />
            <slot />
        </main>
    </div>
    <div class="drawer-side z-10 lg:h-auto">
        <label for="drawer-toggle" class="drawer-overlay" />
        <SidebarMenu />
    </div>
</div>
