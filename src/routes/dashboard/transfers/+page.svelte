<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { fetchUser } from '$lib/auth';
	import { fetchTransfers, initiateTransfer, refreshBalance } from '$lib/api';
	import type { Transfer } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	let transfers: Transfer[] = [];
	let loading = true;
	let error: string | null = null;
	let anchorWalletUrl = '';

	onMount(async () => {
		if (!browser) return;
		try {
			const user = await fetchUser();
			anchorWalletUrl = user?.anchor_wallet_url || '';
			await loadTransfers();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load user';
			loading = false;
		}
	});

	async function loadTransfers() {
		try {
			transfers = await fetchTransfers();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load transfers';
		} finally {
			loading = false;
		}
	}

	async function openPopup(url: string) {
		if (!anchorWalletUrl) {
			error = 'No anchor wallet URL configured';
			return;
		}
		const popup = window.open(url, 'sep24-popup', 'width=600,height=700,scrollbars=yes');
		if (!popup) {
			error = 'Popup blocked. Please allow popups for this site.';
			return;
		}

		const checkClosed = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkClosed);
				loadTransfers();
				refreshBalance();
			}
		}, 500);

		const terminalStatuses = new Set(['transfer_completed', 'transfer_error', 'transfer_cancelled']);

		function handler(event: MessageEvent) {
			const data = event.data;
			if (typeof data !== 'object' || data === null || data.type !== 'SEP24') return;

			const { status } = data;
			if (!terminalStatuses.has(status)) return;

			window.removeEventListener('message', handler);
			if (!popup.closed) popup.close();
			clearInterval(checkClosed);
			loadTransfers();
			refreshBalance();
		}

		window.addEventListener('message', handler);
	}

	function handleDeposit() {
		openPopup(`${anchorWalletUrl}/sep24/deposit`);
	}

	function handleWithdraw() {
		openPopup(`${anchorWalletUrl}/sep24/withdraw`);
	}
</script>

<svelte:head>
	<title>Transfers - Stellar Basic Payment App</title>
</svelte:head>

<div class="container">
	<h1>Transfers</h1>

	{#if error}
		<div class="error-banner">
			{error}
			<button onclick={() => (error = null)}>×</button>
		</div>
	{/if}

	<div class="actions">
		<button class="btn btn-primary" on:click={handleDeposit}>Deposit</button>
		<button class="btn btn-secondary" on:click={handleWithdraw}>Withdraw</button>
	</div>

	{#if loading}
		<p>Loading transfers...</p>
	{:else if transfers.length === 0}
		<p>No transfers yet. Use Deposit or Withdraw to get started.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Type</th>
					<th>Amount</th>
					<th>Status</th>
					<th>Created</th>
				</tr>
			</thead>
			<tbody>
				{#each transfers as transfer (transfer.id)}
					<tr>
						<td>{transfer.kind}</td>
						<td>{transfer.amount} {transfer.asset_code}</td>
						<td>
							<span class="status-badge status-{transfer.status}">{transfer.status}</span>
						</td>
						<td>{new Date(transfer.created_at).toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		margin-bottom: 1.5rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-primary {
		background: #6f00ff;
		color: white;
	}

	.btn-secondary {
		background: #2d3436;
		color: white;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.status-completed { background: #d4edda; color: #155724; }
	.status-error { background: #f8d7da; color: #721c24; }
	.status-pending { background: #fff3cd; color: #856404; }
	.status-in_progress { background: #cce5ff; color: #004085; }

	.error-banner {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.error-banner button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		color: #721c24;
	}
</style>
