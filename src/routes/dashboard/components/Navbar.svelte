<script>
    import { page } from '$app/stores'
    import { MenuIcon } from 'svelte-feather-icons'
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
                        src="https://id.lobstr.co/GDF2FCG35RSXIYSNT4TET7VMZWA4L3LPD4EHJKT473ODKI4PFPPBOTSJ.png"
                        alt="stellar-account-identicon"
                    />
                </div>
            </button>
            <ul
                class="menu-compact dropdown-content menu rounded-box mt-3 w-52 bg-base-100 p-2 shadow"
            >
                <li>
                    <a href="#" class="justify-between">
                        Profile
                        <span class="badge">New</span>
                    </a>
                </li>
                <li><a href="#">Settings</a></li>
                <li><a href="#">Logout</a></li>
            </ul>
        </div>
    </div>
</header>
