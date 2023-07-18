<script>
    import AssetStats from './components/AssetStats.svelte'
    import RecentPayments from './components/RecentPayments.svelte'
    import FavoriteContacts from './components/FavoriteContacts.svelte'
    import TransferHistory from './components/TransferHistory.svelte'
</script>

<AssetStats />

<div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
    <div class="overflow-x-auto">
        <RecentPayments />
    </div>
    <div class="overflow-x-auto">
        <FavoriteContacts />
    </div>
</div>

<div class="overflow-x-auto">
    <TransferHistory />
</div>
