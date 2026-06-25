<script>
	import { fade, scale } from 'svelte/transition';

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

	// Filter and Search states
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let filterLocation = $state('');
	let filterMaxPrice = $state(null);
	let sortBy = $state('default'); // 'default', 'price-low', 'price-high'

	let filteredProduce = $derived.by(() => {
		let list = produce.filter(item => {
			const name = item.name || '';
			const farmerName = item.farmer || item.farmerName || '';
			const location = item.location || item.farmLocation || '';
			const category = item.category || '';
			
			// Parse numeric price for filtering
			let priceVal = 0;
			if (item.priceVal) {
				priceVal = Number(item.priceVal);
			} else if (item.price) {
				priceVal = Number(item.price.replace(/[^0-9]/g, ''));
			}

			const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			                      farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			                      location.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
			
			const matchesLocation = !filterLocation || location.toLowerCase().includes(filterLocation.toLowerCase());
			
			const matchesPrice = !filterMaxPrice || priceVal <= filterMaxPrice;
			
			return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
		});

		if (sortBy === 'price-low') {
			list.sort((a, b) => {
				const priceA = Number(a.priceVal || (a.price ? a.price.replace(/[^0-9]/g, '') : 0));
				const priceB = Number(b.priceVal || (b.price ? b.price.replace(/[^0-9]/g, '') : 0));
				return priceA - priceB;
			});
		} else if (sortBy === 'price-high') {
			list.sort((a, b) => {
				const priceA = Number(a.priceVal || (a.price ? a.price.replace(/[^0-9]/g, '') : 0));
				const priceB = Number(b.priceVal || (b.price ? b.price.replace(/[^0-9]/g, '') : 0));
				return priceB - priceA;
			});
		}
		
		return list;
	});

	// Modal states
	let showProductModal = $state(false);
	let selectedProduct = $state(null);
	let currentModalView = $state('details'); // 'details' or 'profile'

	function viewDetails(product) {
		selectedProduct = product;
		currentModalView = 'details';
		showProductModal = true;
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = 'All';
		filterLocation = '';
		filterMaxPrice = null;
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Customer Dashboard - AgriConnect</title>
</svelte:head>

<!-- Main Container -->
<section class="max-w-[1440px] mx-auto space-y-6 text-slate-800 bg-[#F8FAF5] min-h-[85vh] p-1 rounded-3xl">
	
	<!-- Top Welcome & Tabs -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 border-b border-emerald-100 pb-5">
		<div>
			<h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
				<span class="text-primary-green">🌾</span> Produce Marketplace
			</h1>
			<p class="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed max-w-xl">
				Direct connection between verified farmers and local buyers. Arrange deliveries, quantities, and pricing negotiations directly—no transaction fees, no commissions.
			</p>
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

	<!-- Search & Filters Toolbar -->
	<div class="bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm space-y-4">
		<div class="grid gap-4 md:grid-cols-12 items-center">
			
			<!-- Search query -->
			<div class="relative md:col-span-4 w-full">
				<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
				<input 
					type="text" 
					bind:value={searchQuery}
					placeholder="Search crops, farms, location..." 
					class="w-full bg-slate-50 border border-slate-200/50 rounded-2xl py-2 pl-9 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary-green focus:bg-white transition-all outline-none"
				/>
			</div>

			<!-- Location filter -->
			<div class="relative md:col-span-3 w-full">
				<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">pin_drop</span>
				<input 
					type="text" 
					bind:value={filterLocation}
					placeholder="Filter by farm location..." 
					class="w-full bg-slate-50 border border-slate-200/50 rounded-2xl py-2 pl-9 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary-green focus:bg-white transition-all outline-none"
				/>
			</div>

			<!-- Max Price Filter -->
			<div class="relative md:col-span-3 w-full flex items-center gap-2">
				<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Max Price (₹)</span>
				<input 
					type="number" 
					bind:value={filterMaxPrice}
					placeholder="Any" 
					min="0"
					step="1"
					class="w-full bg-slate-50 border border-slate-200/50 rounded-2xl py-2 px-3.5 text-xs font-semibold focus:ring-2 focus:ring-primary-green focus:bg-white transition-all outline-none"
				/>
			</div>

			<!-- Sort controls -->
			<div class="md:col-span-2 flex items-center gap-2">
				<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Sort</span>
				<select 
					bind:value={sortBy} 
					class="w-full bg-slate-50 border border-slate-200/50 rounded-2xl py-2 px-3 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary-green/20 outline-none"
				>
					<option value="default">Default</option>
					<option value="price-low">Price: Low to High</option>
					<option value="price-high">Price: High to Low</option>
				</select>
			</div>
		</div>

		<!-- Category Chips Selection -->
		<div class="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3">
			<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Categories:</span>
			{#each ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy'] as cat}
				<button
					type="button"
					onclick={() => { selectedCategory = cat; }}
					class={[
						'px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap',
						selectedCategory === cat
							? 'bg-primary-green text-white border-primary-green shadow-sm'
							: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
					]}
				>
					{cat}
				</button>
			{/each}
		</div>
	</div>

	<!-- Marketplace Grid and Side widgets -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Marketplace Crops Cards (2 cols) -->
		<div class="lg:col-span-2 space-y-4">
			<div class="flex justify-between items-center mb-1">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Verified Produce Available</h3>
				<span class="text-xs font-semibold text-slate-400">{filteredProduce.length} harvests listed</span>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				{#each filteredProduce as crop (crop.id)}
					<article 
						onclick={() => viewDetails(crop)}
						class="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
					>
						<div class="h-44 w-full relative">
							<img src={crop.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'} alt={crop.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
							<div class="absolute bottom-3 left-4 text-white">
								<h4 class="font-extrabold text-lg">{crop.name}</h4>
								<p class="text-[10px] text-white/80 font-medium">Sourced by {crop.farmer || 'Verified Farmer'}</p>
							</div>
						</div>

						<div class="p-4 flex-grow flex flex-col justify-between gap-4">
							<div class="flex justify-between items-center text-xs">
								<span class={['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', crop.stageColor || 'bg-emerald-50 text-dark-green border-emerald-100/50']}>
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
				{:else}
					<div class="col-span-full py-16 text-center bg-white border border-slate-200/50 rounded-2xl shadow-sm">
						<span class="material-symbols-outlined text-4xl text-slate-300">storefront</span>
						<p class="mt-2 text-slate-500 font-medium">No produce matches your filters.</p>
					</div>
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
			
			<button 
				onclick={resetFilters}
				class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-full border border-slate-200/50 transition-all flex items-center justify-center gap-1.5"
			>
				<span class="material-symbols-outlined text-[16px]">restart_alt</span>
				Clear All Filters
			</button>
		</div>

	</div>

	<!-- PRODUCT DETAILS / FARMER PROFILE MODAL -->
	{#if showProductModal && selectedProduct}
		<div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div transition:scale={{ duration: 200, start: 0.95 }} class="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
				
				<!-- Modal Header -->
				<div class="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Marketplace</span>
						<span class="text-slate-300">/</span>
						<span class="text-xs font-bold text-primary-green uppercase tracking-wider">{selectedProduct.category || 'Produce'}</span>
					</div>
					<button onclick={() => { showProductModal = false; }} class="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 flex items-center">
						<span class="material-symbols-outlined text-xl">close</span>
					</button>
				</div>

				<!-- Modal Scrollable Content Container -->
				<div class="overflow-y-auto p-6 space-y-6">
					
					<!-- View 1: Product details -->
					{#if currentModalView === 'details'}
						<div class="grid gap-6 md:grid-cols-2">
							<!-- Product Image Left -->
							<div class="rounded-2xl overflow-hidden border border-emerald-100/50 bg-slate-50 h-64 md:h-80 relative shadow-sm">
								<img src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'} alt={selectedProduct.name} class="w-full h-full object-cover" />
								<span class="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow">
									<span class="material-symbols-outlined text-[12px]">verified</span>
									Verified Farm
								</span>
							</div>

							<!-- Details Right -->
							<div class="flex flex-col justify-between">
								<div class="space-y-3">
									<h2 class="text-2xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
									
									<div class="flex flex-wrap items-center gap-2">
										<span class="bg-emerald-50 text-dark-green text-xs font-bold px-3 py-1 rounded-full border border-emerald-200/50">
											Price: {selectedProduct.price || '₹2,000 / Qtl'}
										</span>
										<span class="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
											Stock: {selectedProduct.acres ? (selectedProduct.acres * 2) + ' Qtl' : selectedProduct.size || '30 Qtl'}
										</span>
									</div>

									<p class="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
										{selectedProduct.description || 'Freshly harvested local agricultural product. Certified for quality and sourced directly.'}
									</p>
								</div>

								<!-- Date & Location Footer -->
								<div class="pt-4 mt-4 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-500">
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-[16px] text-primary-green">calendar_month</span>
										<span>Planted/Harvest Date: <strong class="text-slate-700">{selectedProduct.plantedDate || 'Recently Harvested'}</strong></span>
									</div>
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-[16px] text-primary-green">pin_drop</span>
										<span>Farm Origin: <strong class="text-slate-700">{selectedProduct.location || 'Local Fields'}</strong></span>
									</div>
								</div>
							</div>
						</div>

						<!-- Farmer Information Card -->
						<div class="bg-[#F8FAF5] border border-emerald-100/50 rounded-2xl p-5 mt-4 space-y-3">
							<div class="flex items-center justify-between">
								<h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">Farmer Information</h4>
								<button 
									onclick={() => { currentModalView = 'profile'; }}
									class="text-xs font-bold text-primary-green hover:text-dark-green hover:underline flex items-center gap-0.5"
								>
									View Full Farm Profile →
								</button>
							</div>

							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div class="flex items-center gap-3">
									<!-- Farmer Avatar -->
									<div class="size-12 rounded-full bg-gradient-to-tr from-primary-green to-dark-green text-white flex items-center justify-center font-extrabold text-sm shadow-sm uppercase">
										{(selectedProduct.farmer || selectedProduct.farmerName || 'F')[0]}
									</div>
									<div>
										<p class="text-sm font-bold text-slate-800 flex items-center gap-1">
											{selectedProduct.farmer || selectedProduct.farmerName || 'AgriConnect Farmer'}
											<span class="material-symbols-outlined text-[15px] text-emerald-500 filled" title="Verified">verified</span>
										</p>
										<p class="text-xs text-slate-400 mt-0.5">{selectedProduct.farmName || 'Local Family Farm'} • {selectedProduct.location || 'Local Fields'}</p>
									</div>
								</div>

								<!-- Direct Action Buttons -->
								<div class="flex items-center gap-2">
									<a 
										href="tel:{selectedProduct.farmerPhone || '+919876543210'}" 
										class="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-sm transition-all"
									>
										📞 Call
									</a>
									<a 
										href="mailto:{selectedProduct.farmerEmail || 'farmer@agriconnect.com'}?subject=Marketplace Inquiry - {selectedProduct.name}" 
										class="bg-primary-green hover:bg-dark-green text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-md shadow-primary-green/15 transition-all"
									>
										✉ Send Email
									</a>
								</div>
							</div>
						</div>

						<!-- Contact section negotiations notice -->
						<div class="bg-gradient-to-br from-emerald-100/40 to-emerald-50/20 border border-emerald-200/50 rounded-2xl p-5 text-center space-y-2">
							<h3 class="font-extrabold text-dark-green text-base">Interested in this produce?</h3>
							<p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
								Delivery arrangements, bulk quantity discounts, and final pricing negotiations are handled directly between the buyer and farmer.
							</p>
							<div class="flex justify-center gap-3 pt-2">
								<a 
									href="tel:{selectedProduct.farmerPhone || '+919876543210'}" 
									class="bg-white hover:bg-slate-100 border border-emerald-200 text-dark-green text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all"
								>
									📞 Call Farmer
								</a>
								<a 
									href="mailto:{selectedProduct.farmerEmail || 'farmer@agriconnect.com'}?subject=Inquiry about {selectedProduct.name}" 
									class="bg-white hover:bg-slate-100 border border-emerald-200 text-dark-green text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all"
								>
									✉ Email Farmer
								</a>
							</div>
						</div>
					
					<!-- View 2: Farmer profile -->
					{:else}
						<button 
							onclick={() => { currentModalView = 'details'; }} 
							class="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2"
						>
							← Back to product details
						</button>

						<!-- Profile header card -->
						<div class="grid gap-6 md:grid-cols-[1fr_2fr] border-b border-slate-100 pb-6">
							<!-- Profile Left -->
							<div class="flex flex-col items-center text-center space-y-3 bg-[#F8FAF5] border border-emerald-100/50 p-5 rounded-2xl">
								<!-- Farm Avatar -->
								<div class="size-20 rounded-full bg-gradient-to-br from-primary-green to-dark-green text-white flex items-center justify-center font-black text-2xl shadow shadow-primary-green/20 uppercase">
									{(selectedProduct.farmName || selectedProduct.farmer || 'F')[0]}
								</div>
								<div>
									<h3 class="font-black text-base text-slate-900 leading-tight flex items-center justify-center gap-1">
										{selectedProduct.farmName || 'Local Family Farm'}
										<span class="material-symbols-outlined text-[16px] text-emerald-500 filled">verified</span>
									</h3>
									<p class="text-xs text-slate-400 mt-1 font-medium">{selectedProduct.location || 'Local Fields'}</p>
								</div>

								<div class="bg-white border border-emerald-100/50 rounded-full px-3 py-1 text-[10px] font-bold text-primary-green uppercase tracking-wider">
									Verified Supplier
								</div>
							</div>

							<!-- Profile Right (Details) -->
							<div class="space-y-4 flex flex-col justify-between text-xs">
								<div class="space-y-2">
									<h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">About the Farm</h4>
									<p class="text-slate-500 leading-relaxed font-medium">
										{selectedProduct.farmName || 'Local Family Farm'} is committed to sustainable, eco-friendly farming practices. Providing the highest quality local agriculture produce harvested fresh to preserve nutritional value and natural taste.
									</p>
								</div>

								<!-- Statistics Bento block -->
								<div class="grid grid-cols-3 gap-3">
									<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
										<p class="text-lg font-black text-primary-green">
											{produce.filter(i => (i.farmer || i.farmerName) === (selectedProduct.farmer || selectedProduct.farmerName)).length || 1}
										</p>
										<p class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Active Lists</p>
									</div>
									<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
										<p class="text-lg font-black text-primary-green">6+</p>
										<p class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Years Farming</p>
									</div>
									<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
										<p class="text-lg font-black text-primary-green">450+ TN</p>
										<p class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Yield</p>
									</div>
								</div>

								<!-- Contact details -->
								<div class="space-y-2 pt-3 border-t border-slate-100">
									<h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">Farmer Contact Details</h4>
									<div class="grid gap-2 sm:grid-cols-2 font-semibold text-slate-600">
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">person</span>
											<span>Farmer: {selectedProduct.farmer || selectedProduct.farmerName || 'AgriConnect Farmer'}</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">pin_drop</span>
											<span>Farm: {selectedProduct.location || 'Local Fields'}</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">call</span>
											<a href="tel:{selectedProduct.farmerPhone || '+919876543210'}" class="hover:text-primary-green hover:underline">{selectedProduct.farmerPhone || '+91 98765 43210'}</a>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">mail</span>
											<a href="mailto:{selectedProduct.farmerEmail || 'farmer@agriconnect.com'}" class="hover:text-primary-green hover:underline truncate">{selectedProduct.farmerEmail || 'farmer@agriconnect.com'}</a>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Farmer's Other Products -->
						<div class="space-y-3 pt-3">
							<h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">Other available products from this farm</h4>
							<div class="grid gap-4 sm:grid-cols-2">
								{#each produce.filter(item => (item.farmer || item.farmerName) === (selectedProduct.farmer || selectedProduct.farmerName) && item.id !== selectedProduct.id) as otherProd}
									<button 
										onclick={() => { selectedProduct = otherProd; currentModalView = 'details'; }}
										class="flex items-center gap-3 p-2 bg-[#F8FAF5]/40 border border-emerald-100 hover:bg-[#F8FAF5] rounded-xl text-left transition-colors cursor-pointer group"
									>
										<img src={otherProd.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'} alt={otherProd.name} class="size-12 rounded-lg object-cover" />
										<div class="flex-grow min-w-0">
											<p class="font-bold text-slate-800 text-xs truncate group-hover:text-primary-green transition-colors">{otherProd.name}</p>
											<p class="text-[10px] text-slate-400 mt-0.5 font-medium">{otherProd.acres ? (otherProd.acres * 2) + ' Qtl' : otherProd.size || '30 Qtl'} • {otherProd.price || '₹2,000 / Qtl'}</p>
										</div>
									</button>
								{:else}
									<p class="text-[10px] text-slate-400 font-semibold italic">No other listings from this farmer at this moment.</p>
								{/each}
							</div>
						</div>
					{/if}

				</div>
			</div>
		</div>
	{/if}

</section>

<style>
	/* Custom scrollbar reset */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
