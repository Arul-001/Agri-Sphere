<script>
	import { authState } from '$lib/auth.svelte.js';
	import { subscribeListings, createListing, updateListing, deleteListing } from '$lib/firebase-data';
	import { slide, fade, scale } from 'svelte/transition';

	// State variables
	let listings = $state([]);
	let loading = $state(true);
	let activeTab = $state('browse'); // 'browse' or 'my-listings'
	
	// Modals
	let showProductModal = $state(false);
	let selectedProduct = $state(null);
	let currentModalView = $state('details'); // 'details' or 'profile'
	
	let showAddEditModal = $state(false);
	let editingProduct = $state(null);

	// Form values for Add/Edit Produce
	let formName = $state('');
	let formCategory = $state('Vegetables');
	let formQuantity = $state(100);
	let formUnit = $state('KG');
	let formPrice = $state(50);
	let formHarvestDate = $state('');
	let formDescription = $state('');
	let formLocation = $state('');
	let formImageInputType = $state('url'); // 'url' or 'file'
	let formImageUrl = $state('');
	let formUploadedPreview = $state('');

	// Filters
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let filterLocation = $state('');
	let filterMaxPrice = $state(null);
	let sortBy = $state('default'); // 'default', 'price-low', 'price-high', 'stock'

	// Subscribe to listings in Firestore
	$effect(() => {
		const unsubscribe = subscribeListings((items) => {
			listings = items;
			loading = false;
		});
		return unsubscribe;
	});

	// Derived listings lists
	let myListings = $derived(listings.filter(item => item.farmerId === authState.profile?.id));
	
	let filteredListings = $derived.by(() => {
		// If on My Listings tab, only filter by farmer's own products
		const sourceList = activeTab === 'my-listings' ? myListings : listings;
		
		let list = sourceList.filter(item => {
			const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			                      item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			                      item.farmLocation.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
			
			const matchesLocation = !filterLocation || item.farmLocation.toLowerCase().includes(filterLocation.toLowerCase());
			
			const matchesPrice = !filterMaxPrice || item.priceVal <= filterMaxPrice;
			
			return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
		});

		if (sortBy === 'price-low') {
			list.sort((a, b) => a.priceVal - b.priceVal);
		} else if (sortBy === 'price-high') {
			list.sort((a, b) => b.priceVal - a.priceVal);
		} else if (sortBy === 'stock') {
			list.sort((a, b) => b.quantity - a.quantity);
		}
		
		return list;
	});

	// Handle file upload
	function handleFileChange(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			formUploadedPreview = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	function handleRemoveUploadedFile() {
		formUploadedPreview = '';
	}

	// Form actions
	function openAddModal() {
		editingProduct = null;
		formName = '';
		formCategory = 'Vegetables';
		formQuantity = 100;
		formUnit = 'KG';
		formPrice = 50;
		formHarvestDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		formDescription = '';
		formLocation = authState.profile?.address || '';
		formImageInputType = 'url';
		formImageUrl = '';
		formUploadedPreview = '';
		showAddEditModal = true;
	}

	function openEditModal(product, event) {
		event.stopPropagation(); // Avoid triggering details modal
		editingProduct = product;
		formName = product.name;
		formCategory = product.category;
		formQuantity = product.quantity;
		formUnit = product.unit;
		formPrice = product.priceVal;
		formHarvestDate = product.harvestDate;
		formDescription = product.description;
		formLocation = product.farmLocation;
		
		if (product.imageUrl.startsWith('data:image')) {
			formImageInputType = 'file';
			formUploadedPreview = product.imageUrl;
			formImageUrl = '';
		} else {
			formImageInputType = 'url';
			formImageUrl = product.imageUrl;
			formUploadedPreview = '';
		}
		showAddEditModal = true;
	}

	async function handleSubmitListing(event) {
		event.preventDefault();
		
		const defaultImages = {
			Vegetables: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=400&q=80',
			Fruits: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=400&q=80',
			Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80',
			Dairy: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80'
		};
		
		const fallbackImage = defaultImages[formCategory] || defaultImages.Vegetables;
		let finalImage = fallbackImage;

		if (formImageInputType === 'url') {
			finalImage = formImageUrl || fallbackImage;
		} else {
			finalImage = formUploadedPreview || fallbackImage;
		}

		const payload = {
			name: formName,
			category: formCategory,
			quantity: Number(formQuantity),
			unit: formUnit,
			priceVal: Number(formPrice),
			harvestDate: formHarvestDate || 'Recently Harvested',
			description: formDescription,
			farmLocation: formLocation,
			imageUrl: finalImage,
			farmerId: authState.profile?.id,
			farmerName: authState.profile?.fullName || 'AgriConnect Farmer',
			farmerEmail: authState.profile?.email || '',
			farmerPhone: authState.profile?.phone || '',
			farmName: authState.profile?.farmName || 'Local Family Farm',
			verified: true
		};

		if (editingProduct) {
			await updateListing(editingProduct.id, payload);
		} else {
			await createListing(payload);
		}

		closeAddEditModal();
	}

	async function handleDeleteListing(productId, event) {
		event.stopPropagation();
		if (confirm('Are you sure you want to remove this listing?')) {
			await deleteListing(productId);
			if (selectedProduct?.id === productId) {
				showProductModal = false;
			}
		}
	}

	function closeAddEditModal() {
		showAddEditModal = false;
		editingProduct = null;
		formImageUrl = '';
		formUploadedPreview = '';
	}

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
	<title>Marketplace - AgriConnect</title>
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
		
		<!-- Action & Tab Bar (Context-based) -->
		<div class="flex flex-wrap items-center gap-3">
			{#if authState.profile?.role === 'farmer'}
				<div class="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/50">
					<button
						onclick={() => { activeTab = 'browse'; }}
						class={[
							'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5',
							activeTab === 'browse' ? 'bg-white text-dark-green shadow-sm' : 'text-slate-500 hover:text-slate-800'
						]}
					>
						<span class="material-symbols-outlined text-[16px]">storefront</span>
						Browse Marketplace
					</button>
					<button
						onclick={() => { activeTab = 'my-listings'; }}
						class={[
							'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5',
							activeTab === 'my-listings' ? 'bg-white text-dark-green shadow-sm' : 'text-slate-500 hover:text-slate-800'
						]}
					>
						<span class="material-symbols-outlined text-[16px]">inventory_2</span>
						My Produce Listings
					</button>
				</div>

				<button
					onclick={openAddModal}
					class="bg-gradient-to-br from-primary-green to-dark-green text-white font-bold text-xs px-5 py-3 rounded-full flex items-center justify-center gap-1.5 shadow-md shadow-primary-green/20 hover:shadow-primary-green/40 hover:-translate-y-0.5 transition-all"
				>
					<span class="material-symbols-outlined text-[18px]">add_circle</span>
					List Produce for Sale
				</button>
			{:else}
				<span class="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl max-w-xs truncate inline-block shadow-sm">
					📍 Target Shipping: <strong class="text-primary-green">{authState.profile?.address || 'Mumbai Logistics Hub'}</strong>
				</span>
			{/if}
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
					<option value="stock">Stock: High to Low</option>
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

	<!-- Marketplace Title / Header Details -->
	<div class="flex justify-between items-center mb-2">
		<h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider">
			{#if activeTab === 'my-listings'}
				📋 My active produce offers
			{:else}
				🥬 Verified farm listings
			{/if}
		</h3>
		<span class="text-xs font-semibold text-slate-500">
			{filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} matching filters
		</span>
	</div>

	<!-- Main Listings Area -->
	{#if loading}
		<!-- Loading Skeleton -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
			{#each Array(4) as _}
				<div class="bg-white rounded-2xl border border-slate-200/50 overflow-hidden h-[380px] space-y-4">
					<div class="h-48 bg-slate-200"></div>
					<div class="p-4 space-y-3">
						<div class="h-5 bg-slate-200 rounded w-3/4"></div>
						<div class="h-4 bg-slate-200 rounded w-1/2"></div>
						<div class="h-10 bg-slate-200 rounded"></div>
						<div class="h-8 bg-slate-200 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredListings.length > 0}
		<!-- Responsive Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each filteredListings as product (product.id)}
				<article 
					onclick={() => viewDetails(product)}
					class="bg-white rounded-2xl border border-emerald-100/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
				>
					<!-- Card Image Header -->
					<div class="h-48 w-full relative overflow-hidden bg-slate-100">
						<img 
							src={product.imageUrl} 
							alt={product.name} 
							class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
						
						<!-- Verification Badge & Category -->
						<div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
							{#if product.verified}
								<span class="bg-emerald-500/90 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm backdrop-blur-sm">
									<span class="material-symbols-outlined text-[11px]">verified</span>
									Verified Farmer
								</span>
							{/if}
							<span class="bg-slate-900/40 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
								{product.category}
							</span>
						</div>

						{#if authState.profile?.role === 'farmer' && product.farmerId === authState.profile?.id}
							<!-- Delete & Edit quick actions for farmer's own products -->
							<div class="absolute top-3 right-3 flex items-center gap-1.5">
								<button
									onclick={(e) => openEditModal(product, e)}
									class="bg-white/90 text-slate-700 hover:bg-white hover:text-primary-green p-1.5 rounded-full shadow-sm transition-colors flex items-center"
									title="Edit Listing"
								>
									<span class="material-symbols-outlined text-[16px]">edit</span>
								</button>
								<button
									onclick={(e) => handleDeleteListing(product.id, e)}
									class="bg-white/90 text-red-600 hover:bg-red-50 hover:text-red-700 p-1.5 rounded-full shadow-sm transition-colors flex items-center"
									title="Delete Listing"
								>
									<span class="material-symbols-outlined text-[16px]">delete</span>
								</button>
							</div>
						{/if}

						<div class="absolute bottom-3 left-4 text-white">
							<h4 class="font-black text-base md:text-lg tracking-tight leading-tight drop-shadow-sm">{product.name}</h4>
							<p class="text-[10px] text-emerald-100 font-semibold mt-0.5">{product.farmName}</p>
						</div>
					</div>

					<!-- Card Body Details -->
					<div class="p-4 flex-grow flex flex-col justify-between gap-4">
						<div class="space-y-2">
							<div class="flex justify-between items-center text-xs">
								<span class="text-slate-400 font-bold flex items-center gap-0.5">
									<span class="material-symbols-outlined text-[15px]">pin_drop</span>
									{product.farmLocation}
								</span>
								<span class="text-slate-400 font-bold flex items-center gap-0.5">
									<span class="material-symbols-outlined text-[15px]">calendar_month</span>
									Harvest: {product.harvestDate}
								</span>
							</div>

							<!-- Available stock indicator -->
							<div class="bg-[#F8FAF5] border border-emerald-100/30 rounded-xl p-2.5 flex justify-between items-center">
								<div>
									<p class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Available Stock</p>
									<p class="text-sm font-extrabold text-slate-700 mt-0.5">{product.quantity} <span class="text-[10px] text-slate-400 font-bold">{product.unit}</span></p>
								</div>
								<div class="text-right">
									<p class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Direct Price</p>
									<p class="text-base font-black text-primary-green mt-0.5">
										₹{product.priceVal.toFixed(2)}
										<span class="text-[10px] text-slate-400 font-normal">/ {product.unit.toLowerCase()}</span>
									</p>
								</div>
							</div>
						</div>

						<!-- Action buttons -->
						<div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
							<a 
								href="tel:{product.farmerPhone}" 
								onclick={(e) => e.stopPropagation()}
								class="bg-emerald-50 hover:bg-emerald-100 text-dark-green text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all border border-emerald-200/50"
							>
								📞 Call Farmer
							</a>
							<a 
								href="mailto:{product.farmerEmail}?subject=Inquiry about {product.name}" 
								onclick={(e) => e.stopPropagation()}
								class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all border border-slate-200/30"
							>
								✉ Email Farmer
							</a>
						</div>
						<button 
							type="button"
							class="w-full text-[10px] font-extrabold text-center uppercase tracking-wider text-slate-400 hover:text-primary-green transition-colors mt-1"
						>
							View Full Product Details →
						</button>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div in:fade class="bg-white rounded-2xl border border-slate-200/60 p-12 max-w-lg mx-auto text-center space-y-5 shadow-sm">
			<!-- Farming Illustration (clean inline SVG) -->
			<div class="w-48 h-48 mx-auto flex items-center justify-center bg-[#F8FAF5] rounded-full p-6">
				<svg viewBox="0 0 100 100" class="w-full h-full text-primary-green" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<!-- Farm Fence & Land -->
					<path d="M10 80h80" stroke-width="4" stroke="currentColor" opacity="0.3" />
					<path d="M20 80v-15h60v15M35 80V65M50 80V65M65 80V65" />
					
					<!-- Growing Plant -->
					<path d="M50 65V35" stroke-width="3" />
					<path d="M50 45c-8-4-15 0-15 0s5 8 15 0c8-4 15 0 15 0s-5 8-15 0" fill="currentColor" fill-opacity="0.1" />
					<path d="M50 35c-6-4-12 0-12 0s4 6 12 0c6-4 12 0 12 0s-4 6-12 0" fill="currentColor" fill-opacity="0.2" />
					
					<!-- Sun -->
					<circle cx="80" cy="30" r="8" fill="#FBBF24" stroke="#FBBF24" opacity="0.8" />
				</svg>
			</div>
			
			<div class="space-y-2">
				<h3 class="font-extrabold text-slate-900 text-lg">No produce available at the moment</h3>
				<p class="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
					We couldn't find any produce listings matching your query or selected categories. Clear filters or browse other sections.
				</p>
			</div>

			<button 
				onclick={resetFilters}
				class="bg-primary-green hover:bg-dark-green text-white text-xs font-bold px-6 py-3 rounded-full shadow-md shadow-primary-green/20 transition-all active:scale-95"
			>
				Browse All Categories
			</button>
		</div>
	{/if}

	<!-- PRODUCT DETAILS / FARMER PROFILE MODAL -->
	{#if showProductModal && selectedProduct}
		<div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div transition:scale={{ duration: 200, start: 0.95 }} class="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
				
				<!-- Modal Header -->
				<div class="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Marketplace</span>
						<span class="text-slate-300">/</span>
						<span class="text-xs font-bold text-primary-green uppercase tracking-wider">{selectedProduct.category}</span>
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
								<img src={selectedProduct.imageUrl} alt={selectedProduct.name} class="w-full h-full object-cover" />
								{#if selectedProduct.verified}
									<span class="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow">
										<span class="material-symbols-outlined text-[12px]">verified</span>
										Verified Farm
									</span>
								{/if}
							</div>

							<!-- Details Right -->
							<div class="flex flex-col justify-between">
								<div class="space-y-3">
									<h2 class="text-2xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
									
									<div class="flex flex-wrap items-center gap-2">
										<span class="bg-emerald-50 text-dark-green text-xs font-bold px-3 py-1 rounded-full border border-emerald-200/50">
											Price: ₹{selectedProduct.priceVal.toFixed(2)} / {selectedProduct.unit}
										</span>
										<span class="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
											Stock: {selectedProduct.quantity} {selectedProduct.unit}
										</span>
									</div>

									<p class="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
										{selectedProduct.description || 'No description provided. Freshly harvested local agricultural product.'}
									</p>
								</div>

								<!-- Date & Location Footer -->
								<div class="pt-4 mt-4 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-500">
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-[16px] text-primary-green">calendar_month</span>
										<span>Harvest Date: <strong class="text-slate-700">{selectedProduct.harvestDate}</strong></span>
									</div>
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-[16px] text-primary-green">pin_drop</span>
										<span>Farm Origin: <strong class="text-slate-700">{selectedProduct.farmLocation}</strong></span>
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
										{selectedProduct.farmerName[0]}
									</div>
									<div>
										<p class="text-sm font-bold text-slate-800 flex items-center gap-1">
											{selectedProduct.farmerName}
											<span class="material-symbols-outlined text-[15px] text-emerald-500 filled" title="Verified">verified</span>
										</p>
										<p class="text-xs text-slate-400 mt-0.5">{selectedProduct.farmName} • {selectedProduct.farmLocation}</p>
									</div>
								</div>

								<!-- Direct Action Buttons -->
								<div class="flex items-center gap-2">
									<a 
										href="tel:{selectedProduct.farmerPhone}" 
										class="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-sm transition-all"
									>
										📞 Call
									</a>
									<a 
										href="mailto:{selectedProduct.farmerEmail}?subject=Marketplace Inquiry - {selectedProduct.name}" 
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
									href="tel:{selectedProduct.farmerPhone}" 
									class="bg-white hover:bg-slate-100 border border-emerald-200 text-dark-green text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all"
								>
									📞 Call Farmer
								</a>
								<a 
									href="mailto:{selectedProduct.farmerEmail}?subject=Inquiry about {selectedProduct.name}" 
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
									{selectedProduct.farmName[0]}
								</div>
								<div>
									<h3 class="font-black text-base text-slate-900 leading-tight flex items-center justify-center gap-1">
										{selectedProduct.farmName}
										<span class="material-symbols-outlined text-[16px] text-emerald-500 filled">verified</span>
									</h3>
									<p class="text-xs text-slate-400 mt-1 font-medium">{selectedProduct.farmLocation}</p>
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
										{selectedProduct.farmName} is committed to sustainable, eco-friendly farming practices. Providing the highest quality local agriculture produce harvested fresh to preserve nutritional value and natural taste.
									</p>
								</div>

								<!-- Statistics Bento block -->
								<div class="grid grid-cols-3 gap-3">
									<div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
										<p class="text-lg font-black text-primary-green">{listings.filter(i => i.farmerId === selectedProduct.farmerId).length || 1}</p>
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
											<span>Farmer: {selectedProduct.farmerName}</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">pin_drop</span>
											<span>Farm: {selectedProduct.farmLocation}</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">call</span>
											<a href="tel:{selectedProduct.farmerPhone}" class="hover:text-primary-green hover:underline">{selectedProduct.farmerPhone}</a>
										</div>
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[15px] text-primary-green">mail</span>
											<a href="mailto:{selectedProduct.farmerEmail}" class="hover:text-primary-green hover:underline truncate">{selectedProduct.farmerEmail}</a>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Farmer's Other Products -->
						<div class="space-y-3 pt-3">
							<h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">Other available products from this farm</h4>
							<div class="grid gap-4 sm:grid-cols-2">
								{#each listings.filter(item => item.farmerId === selectedProduct.farmerId && item.id !== selectedProduct.id) as otherProd}
									<button 
										onclick={() => { selectedProduct = otherProd; currentModalView = 'details'; }}
										class="flex items-center gap-3 p-2 bg-[#F8FAF5]/40 border border-emerald-100 hover:bg-[#F8FAF5] rounded-xl text-left transition-colors cursor-pointer group"
									>
										<img src={otherProd.imageUrl} alt={otherProd.name} class="size-12 rounded-lg object-cover" />
										<div class="flex-grow min-w-0">
											<p class="font-bold text-slate-800 text-xs truncate group-hover:text-primary-green transition-colors">{otherProd.name}</p>
											<p class="text-[10px] text-slate-400 mt-0.5 font-medium">{otherProd.quantity} {otherProd.unit} • ₹{otherProd.priceVal.toFixed(2)}/{otherProd.unit.toLowerCase()}</p>
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

	<!-- ADD / EDIT PRODUCE MODAL (FARMERS ONLY) -->
	{#if showAddEditModal}
		<div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div transition:slide={{ duration: 200 }} class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 overflow-hidden max-h-[95vh] flex flex-col">
				
				<!-- Modal Header -->
				<div class="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
					<h3 class="font-black text-slate-800 text-base">
						{editingProduct ? '✏️ Edit Produce Listing' : '🌱 List New Produce'}
					</h3>
					<button onclick={closeAddEditModal} class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 flex items-center">
						<span class="material-symbols-outlined text-lg">close</span>
					</button>
				</div>

				<!-- Modal Form Body -->
				<form onsubmit={handleSubmitListing} class="mt-4 space-y-4 text-xs font-semibold text-slate-700 overflow-y-auto pr-1">
					<label class="block">
						<span class="block mb-1">Product Name</span>
						<input type="text" bind:value={formName} required placeholder="e.g. Organic Tomatoes" class="input-field w-full text-xs" />
					</label>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Category</span>
							<select bind:value={formCategory} class="input-field w-full text-xs bg-white py-[9.5px]">
								<option value="Vegetables">Vegetables</option>
								<option value="Fruits">Fruits</option>
								<option value="Grains">Grains</option>
								<option value="Dairy">Dairy</option>
							</select>
						</label>
						<label class="block">
							<span class="block mb-1">Farm Location (State/City)</span>
							<input type="text" bind:value={formLocation} required placeholder="e.g. VT, CA" class="input-field w-full text-xs" />
						</label>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Available Quantity</span>
							<input type="number" bind:value={formQuantity} min="1" required class="input-field w-full text-xs" />
						</label>
						<label class="block">
							<span class="block mb-1">Unit</span>
							<select bind:value={formUnit} class="input-field w-full text-xs bg-white py-[9.5px]">
								<option value="KG">KG</option>
								<option value="Tons">Tons</option>
								<option value="Pieces">Pieces</option>
								<option value="Jars">Jars</option>
							</select>
						</label>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Price per Unit (₹)</span>
							<input type="number" bind:value={formPrice} min="1" step="1" required class="input-field w-full text-xs" />
						</label>
						<label class="block">
							<span class="block mb-1">Harvest Date</span>
							<input type="text" bind:value={formHarvestDate} placeholder="e.g. Jun 10, 2026" class="input-field w-full text-xs" />
						</label>
					</div>

					<label class="block">
						<span class="block mb-1">Product Description</span>
						<textarea bind:value={formDescription} rows="3" placeholder="Describe quality, variety, and packaging..." class="input-field w-full text-xs"></textarea>
					</label>

					<!-- Image Uploader option -->
					<div class="space-y-2">
						<span class="block mb-1">Product Image</span>
						<div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200/50">
							<button
								type="button"
								onclick={() => { formImageInputType = 'url'; }}
								class={[
									'flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all',
									formImageInputType === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
								]}
							>
								Image URL
							</button>
							<button
								type="button"
								onclick={() => { formImageInputType = 'file'; }}
								class={[
									'flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all',
									formImageInputType === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
								]}
							>
								Upload Image
							</button>
						</div>

						{#if formImageInputType === 'url'}
							<input
								type="url"
								bind:value={formImageUrl}
								placeholder="https://images.unsplash.com..."
								class="input-field w-full text-xs"
							/>
						{:else}
							{#if formUploadedPreview}
								<div class="relative rounded-2xl overflow-hidden border border-slate-200 h-28 flex items-center justify-center bg-slate-50">
									<img src={formUploadedPreview} alt="Uploaded produce preview" class="w-full h-full object-cover" />
									<button
										type="button"
										onclick={handleRemoveUploadedFile}
										class="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center"
									>
										<span class="material-symbols-outlined text-[14px]">close</span>
									</button>
								</div>
							{:else}
								<label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary-green hover:bg-emerald-50/20 rounded-2xl p-4 cursor-pointer transition-all duration-200 group">
									<span class="material-symbols-outlined text-2xl text-slate-400 group-hover:text-primary-green mb-1 transition-colors">cloud_upload</span>
									<span class="text-[10px] text-slate-500 font-bold group-hover:text-primary-green transition-colors">Click to upload produce photo</span>
									<span class="text-[8px] text-slate-400 mt-0.5">PNG, JPG, JPEG up to 5MB</span>
									<input
										type="file"
										accept="image/*"
										class="hidden"
										onchange={handleFileChange}
									/>
								</label>
							{/if}
						{/if}
					</div>

					<div class="flex gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
						<button 
							type="button" 
							onclick={closeAddEditModal}
							class="btn-secondary flex-1 py-3 text-xs"
						>
							Cancel
						</button>
						<button 
							type="submit" 
							class="btn-primary flex-1 py-3 text-xs"
						>
							{editingProduct ? 'Save Listing' : 'Publish Listing'}
						</button>
					</div>
				</form>
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
