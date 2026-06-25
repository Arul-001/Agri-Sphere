<script>
	import { fade, slide } from 'svelte/transition';

	let { data } = $props();

	let products = $state([]);
	$effect(() => {
		products = data.products || [];
	});

	let showAddModal = $state(false);

	// Form values
	let newName = $state('');
	let newCategory = $state('Grains');
	let newPrice = $state('');
	let newSize = $state('');
	let newDescription = $state('');
	let newImageUrl = $state('');

	let loading = $state(false);
	let error = $state('');

	async function handleAddProduct(event) {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newName,
					category: newCategory,
					price: newPrice.startsWith('₹') ? newPrice : `₹${newPrice}`,
					size: newSize,
					description: newDescription,
					imageUrl: newImageUrl
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to list product');
			}

			const added = await res.json();
			products = [...products, added];

			// Reset form
			newName = '';
			newPrice = '';
			newSize = '';
			newDescription = '';
			newImageUrl = '';
			showAddModal = false;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function toggleStatus(product) {
		const nextStatus = product.status === 'Available' ? 'Sold' : 'Available';
		try {
			const res = await fetch(`/api/products/${product.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: nextStatus })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to update status');
			}

			const updated = await res.json();
			products = products.map(p => p.id === product.id ? updated : p);
		} catch (err) {
			alert(err.message);
		}
	}

	async function handleDeleteProduct(id) {
		if (!confirm('Are you sure you want to remove this product listing?')) return;
		try {
			const res = await fetch(`/api/products/${id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to delete product');
			}

			products = products.filter(p => p.id !== id);
		} catch (err) {
			alert(err.message);
		}
	}
</script>

<svelte:head>
	<title>Product Listings - AgriConnect</title>
</svelte:head>

<section class="max-w-[1440px] mx-auto space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
		<div>
			<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Marketplace Listings</h1>
			<p class="text-sm text-slate-500 mt-1">List your farm yields on the marketplace for traders and customers.</p>
		</div>
		<button 
			onclick={() => showAddModal = true}
			class="bg-gradient-to-br from-primary-green to-dark-green text-white font-bold text-xs px-5 py-3 rounded-full flex items-center justify-center gap-1.5 shadow-md shadow-primary-green/20 hover:shadow-primary-green/45 hover:-translate-y-0.5 transition-all whitespace-nowrap"
		>
			<span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
			<span>List New Product</span>
		</button>
	</div>

	<!-- Add Product Modal -->
	{#if showAddModal}
		<div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div transition:slide={{ duration: 200 }} class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 overflow-hidden">
				<div class="flex justify-between items-center pb-4 border-b border-slate-100">
					<h3 class="font-extrabold text-slate-800 text-base">New Marketplace Listing</h3>
					<button onclick={() => showAddModal = false} class="text-slate-400 hover:text-slate-600 transition-colors">
						<span class="material-symbols-outlined text-lg">close</span>
					</button>
				</div>
				<form onsubmit={handleAddProduct} class="mt-4 space-y-4 text-xs font-semibold text-slate-700">
					<label class="block">
						<span class="block mb-1">Product Name</span>
						<input type="text" bind:value={newName} required placeholder="e.g. Premium Basmati Rice" class="input-field w-full text-xs" />
					</label>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Price (e.g. 1,800 / Qtl)</span>
							<input type="text" bind:value={newPrice} required placeholder="1,800 / Qtl" class="input-field w-full text-xs" />
						</label>
						<label class="block">
							<span class="block mb-1">Category</span>
							<select bind:value={newCategory} class="input-field w-full text-xs bg-white py-[9.5px]">
								<option value="Grains">Grains</option>
								<option value="Vegetables">Vegetables</option>
								<option value="Fruits">Fruits</option>
								<option value="Legumes">Legumes</option>
							</select>
						</label>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Total Available Size</span>
							<input type="text" bind:value={newSize} required placeholder="e.g. 50 Quintals" class="input-field w-full text-xs" />
						</label>
						<label class="block">
							<span class="block mb-1">Product Image URL (Optional)</span>
							<input type="url" bind:value={newImageUrl} placeholder="https://..." class="input-field w-full text-xs" />
						</label>
					</div>

					<label class="block">
						<span class="block mb-1">Description</span>
						<textarea bind:value={newDescription} rows="3" placeholder="Describe the quality, freshness, and shipping info..." class="input-field w-full text-xs"></textarea>
					</label>

					{#if error}
						<div class="rounded-2xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 animate-fade-in">
							⚠️ {error}
						</div>
					{/if}

					<div class="flex gap-3 pt-3 border-t border-slate-100">
						<button 
							type="button" 
							onclick={() => showAddModal = false}
							class="btn-secondary flex-1 py-3 text-xs"
						>
							Cancel
						</button>
						<button 
							type="submit" 
							disabled={loading}
							class="btn-primary flex-1 py-3 text-xs"
						>
							{loading ? 'Listing...' : 'Publish Listing'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Products Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each products as product (product.id)}
			<article class="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
				<div class="relative h-48 w-full overflow-hidden">
					<img src={product.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'} alt={product.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
					
					<div class="absolute top-3 right-3 flex gap-1.5">
						<button 
							onclick={() => toggleStatus(product)}
							class="bg-white/85 backdrop-blur-sm text-slate-700 p-1.5 rounded-full hover:bg-emerald-50 hover:text-dark-green transition-colors shadow-sm"
							title="Mark Status"
						>
							<span class="material-symbols-outlined text-[18px]">{product.status === 'Available' ? 'check_box_outline_blank' : 'check_box'}</span>
						</button>
						<button 
							onclick={() => handleDeleteProduct(product.id)}
							class="bg-white/85 backdrop-blur-sm text-red-600 p-1.5 rounded-full hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
						>
							<span class="material-symbols-outlined text-[18px]">delete</span>
						</button>
					</div>
					
					<div class="absolute bottom-3 left-4 text-white">
						<h3 class="text-lg font-extrabold leading-none">{product.name}</h3>
						<p class="text-[10px] opacity-90 mt-1 font-semibold">{product.category}</p>
					</div>
				</div>
				<div class="p-5 flex-grow flex flex-col justify-between gap-4">
					<div class="flex justify-between items-center text-xs">
						<span class={['px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5',
							product.status === 'Available' ? 'bg-emerald-50 text-dark-green border-emerald-100/50' : 'bg-red-50 text-red-700 border-red-100/50'
						]}>
							<span class={['w-1.5 h-1.5 rounded-full', product.status === 'Available' ? 'bg-primary-green' : 'bg-red-500']}></span>
							{product.status}
						</span>
						<span class="text-slate-400 font-semibold">{product.size}</span>
					</div>

					<p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description || 'No description provided.'}</p>

					<div class="flex items-center justify-between border-t border-slate-100 pt-4">
						<div>
							<p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Pricing</p>
							<p class="text-lg font-black text-dark-green mt-0.5">{product.price}</p>
						</div>
					</div>
				</div>
			</article>
		{:else}
			<div class="col-span-full py-16 text-center bg-white border border-slate-200/50 rounded-2xl shadow-sm">
				<span class="material-symbols-outlined text-4xl text-slate-300">storefront</span>
				<p class="mt-2 text-slate-500 font-medium">You haven't listed any products yet.</p>
			</div>
		{/each}
	</div>
</section>
