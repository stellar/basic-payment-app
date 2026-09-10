<!--
@component

The `Navbar` component implements a very simple navigation menu that will be
used on all of the `/dashboard/*` pages a user might interact with. This
includes a link back to the dashboard, as well as the user's SEP-33 identicon,
which is in-turn a menu to see the user's KYC fields and the `/dashboard/dev`
page.

More information about SEP-33 can be found here:
<https://stellar.org/protocol/sep-33>
-->

<script>
    // We import things from external packages that will be needed
    import { MenuIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { page } from '$app/state'
</script>

<header class="navbar bg-base-300">
    <label for="drawer-toggle" class="btn btn-square btn-ghost drawer-button lg:hidden"
        ><MenuIcon size="24" /></label
    >
    <div class="flex-1">
        <a href="/dashboard" class="btn btn-ghost text-xl normal-case">BasicPay</a>
    </div>
    <div class="flex-none">
        <div class="dropdown dropdown-end">
            <button tabindex="0" class="avatar btn btn-circle btn-ghost">
                <div class="w-10 rounded-full">
                    <img
                        src={`https://id.lobstr.co/${$page.data.publicKey}.png`}
                        alt="stellar-account-identicon"
                    />
                </div>
            </button>
            <ul
                class="menu-compact menu dropdown-content z-10 mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
            >
                <li>
                    <a href="/dashboard/settings/kyc" class="justify-between">
                        Manage KYC Information
                    </a>
                </li>
                <li><a href="/dashboard/settings/dev">Dev Helpers</a></li>
            </ul>
        </div>
    </div>
</header>
