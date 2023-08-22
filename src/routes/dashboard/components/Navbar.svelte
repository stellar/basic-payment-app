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
    import { page } from '$app/stores'
</script>

<header class="navbar bg-base-300">
    <label for="drawer-toggle" class="btn-ghost drawer-button btn-square btn lg:hidden"
        ><MenuIcon size="24" /></label
    >
    <div class="flex-1">
        <a href="/dashboard" class="btn-ghost btn text-xl normal-case">BasicPay</a>
    </div>
    <div class="flex-none">
        <div class="dropdown-end dropdown">
            <button tabindex="0" class="btn-ghost btn-circle avatar btn">
                <div class="w-10 rounded-full">
                    <img
                        src={`https://id.lobstr.co/${$page.data.publicKey}.png`}
                        alt="stellar-account-identicon"
                    />
                </div>
            </button>
            <ul
                class="menu-compact dropdown-content menu rounded-box z-10 mt-3 w-52 bg-base-100 p-2 shadow"
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
