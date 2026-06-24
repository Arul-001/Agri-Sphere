<script>
	import { authState } from '$lib/auth.svelte.js';

	// Crop listings mock data with high-quality images from the Stitch design
	const crops = [
		{
			id: 'corn',
			name: 'Sweet Corn',
			location: 'Field Block A',
			farmer: 'Ramesh Kumar',
			planted: 'Apr 12',
			progress: 45,
			size: '50 Quintals',
			price: '₹1,800 / Qtl',
			stage: 'Vegetative Stage',
			stageColor: 'bg-emerald-50 text-dark-green border-emerald-100',
			statusDot: 'bg-primary-green',
			imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d20f6?auto=format&fit=crop&w=400&q=80'
		},
		{
			id: 'wheat',
			name: 'Winter Wheat',
			location: 'North Plateau',
			farmer: 'Surinder Singh',
			planted: 'Oct 05',
			progress: 95,
			size: '120 Quintals',
			price: '₹2,400 / Qtl',
			stage: 'Harvest-Ready',
			stageColor: 'bg-amber-50 text-amber-800 border-amber-100',
			statusDot: 'bg-amber-500',
			imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'
		},
		{
			id: 'soybean',
			name: 'Organic Soybeans',
			location: 'Valley Section 3',
			farmer: 'Vikas Patil',
			planted: 'May 20',
			progress: 65,
			size: '75 Quintals',
			price: '₹4,100 / Qtl',
			stage: 'Flowering Stage',
			stageColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
			statusDot: 'bg-indigo-500',
			imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&q=80'
		}
	];
</script>

<svelte:head>
	<title>Buyer Dashboard - AgriConnect</title>
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
				📍 Shipping to: <strong class="text-dark-green">{authState.profile?.address || 'Mumbai Logistics Hub'}</strong>
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
					140 Tons
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">18 Deliveries</h3>
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
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">2 Contracts</h3>
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
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Outlays (MTD)</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">₹2,45,000</h3>
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
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">8 Partners</h3>
			</div>
		</div>
	</div>

	<!-- Marketplace Grid and Side widgets -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Marketplace Crops Cards (2 cols) -->
		<div class="lg:col-span-2 space-y-4">
			<div class="flex justify-between items-center mb-1">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Verified Produce Available</h3>
				<span class="text-xs font-semibold text-slate-400">{crops.length} harvests listed</span>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				{#each crops as crop (crop.id)}
					<article class="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
						<div class="h-44 w-full relative">
							<img src={crop.imageUrl} alt={crop.name} class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
							<div class="absolute bottom-3 left-4 text-white">
								<h4 class="font-extrabold text-lg">{crop.name}</h4>
								<p class="text-[10px] text-white/80 font-medium">Sourced by {crop.farmer}</p>
							</div>
						</div>

						<div class="p-4 flex-grow flex flex-col justify-between gap-4">
							<div class="flex justify-between items-center text-xs">
								<span class={['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', crop.stageColor]}>
									{crop.stage}
								</span>
								<span class="text-slate-400 font-semibold">{crop.location}</span>
							</div>

							<!-- Growth Progress bar -->
							<div class="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
								<div class="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
									<span>Harvest Progress</span>
									<span>{crop.progress}%</span>
								</div>
								<div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
									<div class="bg-primary-green h-full rounded-full" style="width: {crop.progress}%"></div>
								</div>
							</div>

							<div class="flex items-center justify-between border-t border-slate-100 pt-3">
								<div>
									<p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price / Quantity</p>
									<p class="text-sm font-extrabold text-dark-green mt-0.5">{crop.price}</p>
									<p class="text-[10px] text-slate-500 font-medium">{crop.size} available</p>
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

				<div class="space-y-2">
					<p class="text-sm font-bold text-slate-800">100 Quintals - Organic Maize</p>
					<p class="text-xs text-slate-500">Shipped from Surinder Singh Farm</p>
				</div>

				<div class="space-y-2 pt-2 border-t border-slate-100">
					<div class="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
						<span>On Route</span>
						<span>Delivery Today</span>
					</div>
					<div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
						<div class="bg-primary-green h-full rounded-full" style="width: 80%"></div>
					</div>
				</div>

				<div class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed">
					🚚 <strong>Status:</strong> Shipment is 12km away from Mumbai Logistics Hub. Estimated arrival: 2 hours.
				</div>
			</div>

			<!-- Escrow Quality Guarantee -->
			<div class="glass-card rounded-2xl p-6 bg-gradient-to-br from-emerald-50/50 to-white/70 space-y-3">
				<h3 class="text-sm font-bold text-dark-green uppercase tracking-wider">🛡️ escrow Protected Sourcing</h3>
				<p class="text-xs text-slate-500 leading-relaxed">
					All trades on AgriConnect are protected. Payments remain in escrow until harvest inspection reports are uploaded and confirmed.
				</p>
			</div>
		</div>

	</div>

</section>
