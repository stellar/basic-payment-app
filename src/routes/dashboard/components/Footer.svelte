<script>
    import { GithubIcon } from 'svelte-feather-icons'
</script>

<footer class="footer items-center bg-base-300 p-4">
    <div class="grid-flow-col items-center">
        <ul class="menu menu-vertical md:menu-horizontal">
            <li>
                <a href="https://www.stellar.org/terms-of-service" target="_blank"
                    >Terms of Service</a
                >
            </li>
            <li>
                <a href="https://www.stellar.org/privacy-policy" target="_blank">Privacy Policy</a>
            </li>
        </ul>
    </div>
    <div class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <ul class="menu">
            <li>
                <a href="https://github.com/stellar/basic-payment-app" target="_blank">
                    <GithubIcon size="16" />
                    GitHub
                </a>
            </li>
        </ul>
    </div>
</footer>
