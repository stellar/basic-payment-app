<!--
@component

The `Drawer` component implements a grid layout that can show/hide a sidebar on
the left side of our page. We have wrapped our
`/src/routes/dashboard/+layout.svelte` layout in this Drawer so that every route
underneath the dashboard will have the same layout and functionality.

This drawer component is _somewhat_ responsive to changes in screen size, but we
have not gone to great lengths to ensure optimal display on mobile devices.

For more details, check out the DaisyUI documentation on Drawer layouts:
<https://daisyui.com/components/drawer/>
-->

<script>
    // We import any Svelte components we will need
    import SidebarMenu from './SidebarMenu.svelte'
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
