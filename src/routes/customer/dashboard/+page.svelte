<script>
	let { data } = $props();

	let produce = $derived(data.produce || []);
	let orders = $derived(data.orders || []);

	// Shipping location fallback
	let shippingAddress = $derived(data.profile?.address || 'Mumbai Logistics Hub');

	// Compute Stats
	let activeOrders = $derived(orders.filter(o => o.status !== 'Delivered'));
	let completedOrdersCount = $derived(orders.filter(o => o.status === 'Delivered').length);
	let activeOrdersCount = $derived(activeOrders.length);
	let totalOutlay = $derived(orders.reduce((sum, item) => sum + Number(item.amount || 0), 0));
	
	// Connected Farms count (unique farmers in listed produce or orders)
	let connectedFarmsCount = $derived.by(() => {
		const names = new Set();
		produce.forEach(p => p.farmer && names.add(p.farmer));
		orders.forEach(o => o.farmerName && names.add(o.farmerName));
		return names.size > 0 ? names.size : 8;
	});

	// Format currency helper
	function formatCurrency(val) {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(val);
	}
</script>

<svelte:head>
	<title>Customer Dashboard - AgriConnect</title>
</svelte:head>

<section class="max-w-6xl mx-auto space-y-6">
	
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
		<div>
			<h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Marketplace Overview</h2>
			<p class="text-sm text-slate-500 mt-1">Browse verified farm produce, secure contracts, and track cargo shipments.</p>
		</div>
		<div>
			<span class="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-2xl max-w-xs truncate inline-block">
				📍 Shipping to: <strong class="text-dark-green">{shippingAddress}</strong>
			</span>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary-green">
					<span class="material-symbols-outlined text-[22px]">local_shipping</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
					Deliveries
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">{completedOrdersCount} Deliveries</h3>
			</div>
		</div>

		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
					<span class="material-symbols-outlined text-[22px]">assignment</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
					In Transit
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Purchases</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">{activeOrdersCount} Contracts</h3>
			</div>
		</div>

		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary-green">
					<span class="material-symbols-outlined text-[22px]">payments</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
					Secure escrow
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Outlays (Total)</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalOutlay)}</h3>
			</div>
		</div>

		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
					<span class="material-symbols-outlined text-[22px]">agriculture</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold">
					Verified
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected Farms</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">{connectedFarmsCount} Partners</h3>
			</div>
		</div>
	</div>

	<!-- Marketplace Grid and Side widgets -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Marketplace Crops Cards (2 cols) -->
		<div class="lg:col-span-2 space-y-4">
			<div class="flex justify-between items-center mb-1">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Verified Produce Available</h3>
				<span class="text-xs font-semibold text-slate-400">{produce.length} harvests listed</span>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				{#each produce as crop (crop.id)}
					<article class="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
						<div class="h-44 w-full relative">
							<img src={crop.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'} alt={crop.name} class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
							<div class="absolute bottom-3 left-4 text-white">
								<h4 class="font-extrabold text-lg">{crop.name}</h4>
								<p class="text-[10px] text-white/80 font-medium">Sourced by {crop.farmer || 'Verified Farmer'}</p>
							</div>
						</div>

						<div class="p-4 flex-grow flex flex-col justify-between gap-4">
							<div class="flex justify-between items-center text-xs">
								<span class={['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', crop.stageColor || 'bg-emerald-50 text-dark-green border-emerald-100']}>
									{crop.stage || 'Harvest-Ready'}
								</span>
								<span class="text-slate-400 font-semibold">{crop.location || 'Local Fields'}</span>
							</div>

							<!-- Growth Progress bar -->
							<div class="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
								<div class="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
									<span>Harvest Progress</span>
									<span>{crop.progress || 100}%</span>
								</div>
								<div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
									<div class="bg-primary-green h-full rounded-full" style="width: {crop.progress || 100}%"></div>
								</div>
							</div>

							<div class="flex items-center justify-between border-t border-slate-100 pt-3">
								<div>
									<p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price / Quantity</p>
									<p class="text-sm font-extrabold text-dark-green mt-0.5">{crop.price || '₹2,000 / Qtl'}</p>
									<p class="text-[10px] text-slate-500 font-medium">{crop.acres ? (crop.acres * 2) + ' Qtl' : crop.size || '30 Qtl'} available</p>
								</div>
								<button class="bg-primary-green hover:bg-dark-green text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-sm transition-colors">
									Buy Produce
								</button>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>

		<!-- Right Side Widgets -->
		<div class="space-y-6">
			<!-- Order Shipment Tracker -->
			<div class="glass-card rounded-2xl p-6 space-y-4">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
					<span class="material-symbols-outlined text-[18px] text-primary-green">local_shipping</span>
					Cargo Shipment Transit
				</h3>

				{#if activeOrders.length > 0}
					{#each activeOrders.slice(0, 1) as order}
						<div class="space-y-2">
							<p class="text-sm font-bold text-slate-800">{order.quantity} - {order.cropName}</p>
							<p class="text-xs text-slate-500">Shipped from {order.farmerName}</p>
						</div>

						<div class="space-y-2 pt-2 border-t border-slate-100">
							<div class="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
								<span>On Route</span>
								<span>Status: {order.status}</span>
							</div>
							<div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
								<div class="bg-primary-green h-full rounded-full" style="width: {order.progress || 50}%"></div>
							</div>
						</div>

						<div class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed">
							🚚 <strong>Status Update:</strong> Shipment in transit. Estimated delivery progress: {order.progress || 50}%.
						</div>
					{/each}
				{:else}
					<p class="text-xs text-slate-500">No active cargo shipments currently.</p>
				{/if}
			</div>

			<!-- Escrow Quality Guarantee -->
			<div class="glass-card rounded-2xl p-6 bg-gradient-to-br from-emerald-50/50 to-white/70 space-y-3">
				<h3 class="text-sm font-bold text-dark-green uppercase tracking-wider">🛡️ Escrow Protected Sourcing</h3>
				<p class="text-xs text-slate-500 leading-relaxed">
					All trades on AgriConnect are protected. Payments remain in escrow until harvest inspection reports are uploaded and confirmed.
				</p>
			</div>
		</div>

	</div>

</section>
