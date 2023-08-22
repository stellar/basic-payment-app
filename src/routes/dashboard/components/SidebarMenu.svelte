<!--
@component

The `SidebarMenu` component is part of our Drawer layout and just makes a simple
list of menu links that can be used to navigate throughout the dashboard.
-->

<script>
    // We import any stores we will need to read and/or write
    import { page } from '$app/stores'

    // We are using an array here just to simplify the creation of multiple
    // links that are 99% identical. This technique also makes it easier to
    // modify existing links or add/remove them in the future.
    const dashboardRoutes = [
        { route: '/dashboard/send', text: 'Payments' },
        { route: '/dashboard/assets', text: 'Assets' },
        { route: '/dashboard/contacts', text: 'Contacts' },
        { route: '/dashboard/transfers', text: 'Transfers' },
    ]
</script>

<ul class="menu h-full w-80 bg-base-200 p-4 text-base-content">
    {#each dashboardRoutes as route}
        {@const linkClass = $page.route.id === route.route ? 'active': ''}
        <li>
            <a href={route.route} class={linkClass}
                >{route.text}</a
            >
        </li>
    {/each}
</ul>
