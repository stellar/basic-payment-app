<script>
    import { page } from '$app/stores'

    const dashboardRoutes = [
        { route: '/dashboard/send', text: 'Payments' },
        { route: '/dashboard/assets', text: 'Assets' },
        { route: '/dashboard/contacts', text: 'Contacts' },
        { route: '/dashboard/transfers', text: 'Transfers' },
    ]
</script>

<ul class="menu h-full w-80 bg-base-200 p-4 text-base-content">
    {#each dashboardRoutes as route}
        <li>
            <a href={route.route} class={$page.route.id === route.route ? 'active' : ''}
                >{route.text}</a
            >
        </li>
    {/each}
</ul>
