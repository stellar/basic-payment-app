<script>
    export let asset
</script>

<div class="card w-full bg-base-200 shadow-xl">
    <div class="card-body">
        <h2 class="card-title">{asset.asset_code} <small>({asset.home_domain})</small></h2>
        <p>If a dog chews shoes whose shoes does he choose?</p>
        <div class="flex w-full flex-col lg:flex-row">
            <div class="card rounded-box grid h-20 flex-grow place-items-center bg-base-300">
                Content
            </div>
            <div class="divider lg:divider-horizontal" />
            <div class="card rounded-box grid h-20 flex-grow place-items-center bg-base-300">
                Content
            </div>
        </div>
        <div class="card-actions justify-end">
            <button class="btn-primary btn">Buy Now</button>
        </div>
    </div>
</div>
