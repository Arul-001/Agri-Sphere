<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Determine if the user is logging in or signing up
	let action = $derived(page.url.searchParams.get('action') || 'signup');
	
	let selectedRole = $state('farmer'); // Default to farmer

	const roles = [
		{
			id: 'farmer',
			name: 'Farmer',
			emoji: '🌱',
			description: 'List harvest produce, manage crops, track sales, and connect with direct buyers.'
		},
		{
			id: 'buyer',
			name: 'Buyer',
			emoji: '🛒',
			description: 'Purchase fresh farm-direct crops, manage delivery addresses, and track shipments.'
		},
		{
			id: 'admin',
			name: 'Admin',
			emoji: '⚙️',
			description: 'Manage users, authorize traders, monitor platform analytics, and review logs.'
		}
	];

	function handleContinue() {
		if (action === 'login') {
			goto(`/login?role=${selectedRole}`);
		} else {
			goto(`/signup?role=${selectedRole}`);
		}
	}
</script>

<svelte:head>
	<title>Select Role - AgriConnect</title>
</svelte:head>

<section class="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-6 py-12">
	<div class="text-center space-y-3 max-w-lg mb-10">
		<p class="text-xs font-bold uppercase tracking-wider text-dark-green bg-light-green px-3 py-1 rounded-full w-fit mx-auto">
			Account Setup
		</p>
		<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
			Choose Your Identity
		</h1>
		<p class="text-slate-500">
			Please select your role to continue to {action === 'login' ? 'login' : 'registration'}. Your interface will adapt to your needs.
		</p>
	</div>

	<!-- Interactive Cards -->
	<div class="grid gap-6 w-full md:grid-cols-3">
		{#each roles as role (role.id)}
			<button
				type="button"
				onclick={() => { selectedRole = role.id; }}
				class={[
					'flex flex-col text-left p-6 rounded-2xl bg-white border transition-all duration-300 transform outline-none select-none cursor-pointer',
					selectedRole === role.id
						? 'border-primary-green shadow-xl shadow-primary-green/10 -translate-y-1 scale-[1.02]'
						: 'border-slate-200 hover:border-slate-300 hover:shadow-md'
				]}
			>
				<!-- Active Border Overlay & Checkmark -->
				<div class="flex items-center justify-between w-full mb-4">
					<span class="text-4xl">{role.emoji}</span>
					<span 
						class={[
							'size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
							selectedRole === role.id
								? 'bg-primary-green text-white scale-100'
								: 'bg-slate-100 text-transparent scale-75'
						]}
					>
						✓
					</span>
				</div>

				<h3 class="text-lg font-bold text-slate-800">{role.name}</h3>
				<p class="mt-2 text-sm text-slate-500 leading-relaxed flex-grow">
					{role.description}
				</p>
			</button>
		{/each}
	</div>

	<!-- CTA -->
	<div class="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
		<a 
			href="/" 
			class="w-full sm:w-auto px-8 py-3 text-center rounded-2xl border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all-custom"
		>
			← Back
		</a>
		<button
			type="button"
			onclick={handleContinue}
			class="w-full sm:w-auto px-10 py-3 text-center rounded-2xl bg-gradient-to-br from-primary-green to-dark-green font-semibold text-white shadow-lg shadow-primary-green/20 hover:shadow-primary-green/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
		>
			Continue to {action === 'login' ? 'Login' : 'Signup'} →
		</button>
	</div>
</section>
