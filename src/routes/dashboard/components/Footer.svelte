<!--
@component

The `Footer` component implements a very simple footer that displays links to
SDF's terms of service, privacy policy, and the GitHub repo where this project
can be found.
-->

<script lang="ts">
    // We import things from external packages that will be needed
    import { GithubIcon } from 'svelte-feather-icons'
</script>

<footer class="footer items-center gap-y-2 bg-base-300 p-4 sm:footer-horizontal">
    <div class="grid-flow-col items-center">
        <ul class="menu menu-vertical sm:menu-horizontal">
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
    <div class="grid-flow-col gap-4 sm:place-self-center sm:justify-self-end">
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
