<script>
    import { page } from '$app/stores'
    export let endpoint = ''
    export let assetCode = ''
    export let title = 'Initiate SEP-6 Transfer'
    export let body = 'Please follow the steps to begin a transfer with your chosen anchor.'
    export let homeDomain = ''
    export let sep6Info = {}
</script>

<div class="prose p-3">
    <p>homeDomain: <code>{homeDomain}</code></p>
    <p>assetCode: <code>{assetCode}</code></p>
    <p>endpoint: <code>{endpoint}</code></p>
</div>
