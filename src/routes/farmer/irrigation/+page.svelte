<script>
	import { fade, slide } from 'svelte/transition';

	let { data } = $props();

	let scheduleRuns = $state([]);
	let upcomingRuns = $state([]);
	let activities = $state([]);

	// Manual override valves state
	let valveStateZone1 = $state(false);
	let valveStateZone2 = $state(false);
	let valveStateZone3 = $state(false);

	// Sync data on page load or update
	$effect(() => {
		scheduleRuns = data.scheduleRuns || [];
		upcomingRuns = data.upcomingRuns || [];
		activities = data.activities || [];
		
		// Set values without triggering the save effect
		valveStateZone1 = !!data.valves?.zone1;
		valveStateZone2 = !!data.valves?.zone2;
		valveStateZone3 = !!data.valves?.zone3;
	});

	let activeTab = $state('schedule'); // 'schedule' | 'health' | 'manual'
	let showAddModal = $state(false);

	// Form values for new run
	let newZone = $state('Zone 1: North Orchard');
	let newDate = $state(5);
	let newTime = $state('05:00 - 06:00');

	let loading = $state(false);
	let error = $state('');

	async function handleAddRun(event) {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/irrigation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'add_run',
					payload: {
						zone: newZone,
						date: Number(newDate),
						time: newTime
					}
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to add run');
			}

			const result = await res.json();
			scheduleRuns = [...scheduleRuns, result.run];

			// Clear form & close
			newZone = 'Zone 1: North Orchard';
			newDate = 5;
			newTime = '05:00 - 06:00';
			showAddModal = false;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	// Save valves state whenever a toggle changes
	async function saveValves() {
		try {
			await fetch('/api/irrigation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'update_valves',
					payload: {
						valves: {
							zone1: valveStateZone1,
							zone2: valveStateZone2,
							zone3: valveStateZone3
						}
					}
				})
			});
		} catch (err) {
			console.error('Error saving valves state:', err);
		}
	}

	// Interactive calendar hover highlights
	let hoveredCell = $state(null);
</script>

<svelte:head>
	<title>Irrigation Control - AgriConnect</title>
</svelte:head>

<section class="max-w-[1440px] mx-auto space-y-6">
	<!-- Page Header & Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
		<div>
			<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Irrigation Control</h1>
			<p class="text-sm text-slate-500 mt-1">Monitor and schedule water distribution zones.</p>
		</div>
		<button 
			onclick={() => showAddModal = true}
			class="bg-gradient-to-br from-primary-green to-dark-green text-white font-bold text-xs px-5 py-3 rounded-full flex items-center justify-center gap-1.5 shadow-md shadow-primary-green/20 hover:shadow-primary-green/45 hover:-translate-y-0.5 transition-all whitespace-nowrap"
		>
			<span class="material-symbols-outlined text-[18px]">calendar_today</span>
			<span>Schedule New Run</span>
		</button>
	</div>

	<!-- Add Run Modal -->
	{#if showAddModal}
		<div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div transition:slide={{ duration: 200 }} class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 overflow-hidden">
				<div class="flex justify-between items-center pb-4 border-b border-slate-100">
					<h3 class="font-extrabold text-slate-800 text-base">Irrigation Schedule Event</h3>
					<button onclick={() => showAddModal = false} class="text-slate-400 hover:text-slate-600 transition-colors">
						<span class="material-symbols-outlined text-lg">close</span>
					</button>
				</div>
				<form onsubmit={handleAddRun} class="mt-4 space-y-4 text-xs font-semibold text-slate-700">
					<label class="block">
						<span class="block mb-1">Select Zone</span>
						<select bind:value={newZone} class="input-field w-full text-xs bg-white py-[9.5px]">
							<option value="Zone 1: North Orchard">Zone 1: North Orchard</option>
							<option value="Zone 2: Berries">Zone 2: Berries</option>
							<option value="Zone 3: Greenhouses">Zone 3: Greenhouses</option>
							<option value="Zone 4: Vineyard">Zone 4: Vineyard</option>
							<option value="Fertigation Alpha">Fertigation Alpha</option>
						</select>
					</label>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="block mb-1">Calendar Day (Oct)</span>
							<input type="number" min="1" max="31" bind:value={newDate} required class="input-field w-full text-xs" />
						</label>
						<label class="block">
							<span class="block mb-1">Time Block</span>
							<input type="text" bind:value={newTime} required placeholder="e.g. 05:00 - 06:00" class="input-field w-full text-xs" />
						</label>
					</div>

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
							class="btn-primary flex-1 py-3 text-xs"
						>
							Add Run
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="glass-card rounded-2xl p-6 flex flex-col gap-3 border-l-4 border-l-primary-green">
			<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Water Usage</p>
			<div class="flex items-baseline gap-2">
				<p class="text-3xl font-black text-slate-800">450 <span class="text-sm font-bold text-slate-400">gal</span></p>
				<span class="text-red-500 text-xs font-bold flex items-center">
					<span class="material-symbols-outlined text-sm">trending_up</span> 5%
				</span>
			</div>
			<div class="w-full bg-slate-100 rounded-full h-1.5 mt-2">
				<div class="bg-primary-green h-1.5 rounded-full" style="width: 65%"></div>
			</div>
		</div>

		<div class="glass-card rounded-2xl p-6 flex flex-col gap-3 border-l-4 border-l-primary-green">
			<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Health</p>
			<p class="text-2xl font-black text-slate-800">All Zones Active</p>
			<div class="flex items-center gap-1.5">
				<span class="size-2 bg-primary-green rounded-full animate-pulse"></span>
				<p class="text-primary-green text-xs font-bold">Online & Optimizing</p>
			</div>
		</div>

		<div class="glass-card rounded-2xl p-6 flex flex-col gap-3 border-l-4 border-l-amber-500">
			<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Savings</p>
			<div class="flex items-baseline gap-2">
				<p class="text-3xl font-black text-slate-800">15%</p>
				<span class="text-primary-green text-xs font-bold flex items-center">
					<span class="material-symbols-outlined text-sm">trending_down</span> 2%
				</span>
			</div>
			<p class="text-slate-500 text-xs leading-relaxed">System adjusted for predicted rainfall this afternoon.</p>
		</div>
	</div>

	<!-- Main Body Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		
		<!-- Left Panel: Interactive Schedule and Override Tabs (8 cols) -->
		<div class="lg:col-span-8 space-y-6">
			<!-- Navigation Tabs -->
			<div class="flex border-b border-slate-200 gap-8">
				<button 
					onclick={() => activeTab = 'schedule'}
					class={['pb-4 px-1 font-bold text-xs tracking-wider transition-all border-b-2', 
						activeTab === 'schedule' ? 'border-primary-green text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']}
				>
					IRRIGATION SCHEDULE
				</button>
				<button 
					onclick={() => activeTab = 'health'}
					class={['pb-4 px-1 font-bold text-xs tracking-wider transition-all border-b-2', 
						activeTab === 'health' ? 'border-primary-green text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']}
				>
					SYSTEM HEALTH
				</button>
				<button 
					onclick={() => activeTab = 'manual'}
					class={['pb-4 px-1 font-bold text-xs tracking-wider transition-all border-b-2', 
						activeTab === 'manual' ? 'border-primary-green text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']}
				>
					MANUAL OVERRIDE
				</button>
			</div>

			<!-- Tab contents -->
			{#if activeTab === 'schedule'}
				<div transition:fade={{ duration: 100 }} class="glass-card rounded-2xl overflow-hidden bg-white">
					<div class="p-6 border-b border-slate-100 flex items-center justify-between">
						<h3 class="font-extrabold text-slate-800 text-base">October 2023</h3>
						<div class="flex gap-2">
							<button class="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
								<span class="material-symbols-outlined text-base">chevron_left</span>
							</button>
							<button class="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
								<span class="material-symbols-outlined text-base">chevron_right</span>
							</button>
						</div>
					</div>
					
					<!-- Calendar Grid -->
					<div class="grid grid-cols-7 bg-slate-50/50">
						<!-- Day Headers -->
						{#each ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as day}
							<div class="p-3 text-center text-[10px] font-black text-slate-400 border-r border-b border-slate-100">{day}</div>
						{/each}

						<!-- Empty Cells for previous month alignment -->
						<div class="min-h-[100px] border-r border-b border-slate-100 bg-slate-50/20"></div>
						<div class="min-h-[100px] border-r border-b border-slate-100 bg-slate-50/20"></div>

						<!-- Days of October 2023 -->
						{#each Array(10) as _, index}
							{@const dateNumber = index + 1}
							{@const cellRuns = scheduleRuns.filter(r => r.date === dateNumber)}
							
							<div 
								role="gridcell"
								tabindex="-1"
								onmouseenter={() => hoveredCell = dateNumber}
								onmouseleave={() => hoveredCell = null}
								class={['min-h-[110px] p-3 border-r border-b border-slate-100 flex flex-col justify-between transition-colors relative cursor-pointer',
									hoveredCell === dateNumber ? 'bg-slate-50' : 'bg-white',
									dateNumber === 7 ? 'bg-emerald-50/30' : ''
								]}
							>
								<span class={['text-[11px] font-bold', dateNumber === 7 ? 'text-primary-green font-black' : 'text-slate-400']}>
									{dateNumber}
								</span>
								
								{#if cellRuns.length > 0}
									<div class="space-y-1.5 mt-2">
										{#each cellRuns as run}
											<div class={['p-2 rounded-lg text-[9px] font-extrabold border shadow-sm leading-tight', run.colorClass]}>
												{run.zone}
												<div class="font-normal opacity-85 mt-0.5">{run.time}</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}

						<!-- Additional empty cells to finish row -->
						<div class="min-h-[110px] border-r border-b border-slate-100 bg-slate-50/20"></div>
						<div class="min-h-[110px] border-b border-slate-100 bg-slate-50/20"></div>
					</div>
				</div>

			{:else}
				<!-- System Health / Manual Override content -->
				<div transition:fade={{ duration: 100 }} class="glass-card rounded-2xl p-6 bg-white space-y-6">
					{#if activeTab === 'health'}
						<h3 class="font-extrabold text-slate-800 text-base mb-4">Sprinkler Valve Status</h3>
						<div class="grid gap-4 md:grid-cols-2">
							{#each ['Zone 1: North Orchard', 'Zone 2: Berries', 'Zone 3: Greenhouses', 'Zone 4: Vineyard'] as zone, idx}
								<div class="border border-slate-100 rounded-2xl p-4 flex justify-between items-center bg-slate-50/50">
									<div>
										<h4 class="font-bold text-slate-800">{zone}</h4>
										<p class="text-[10px] text-slate-400 font-bold mt-1 uppercase">Signal: Good • Pressure: 42 PSI</p>
									</div>
									<span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-100">
										Active
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<h3 class="font-extrabold text-slate-800 text-base mb-4">Manual Valve Controls</h3>
						<p class="text-xs text-slate-500 mb-6">Manually trigger irrigation zones. These timers run for a default 15 minutes safety limit.</p>
						<div class="space-y-4">
							<div class="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
								<div>
									<h4 class="font-bold text-slate-800">Zone 1: North Orchard</h4>
									<p class="text-[10px] text-slate-400 mt-1 font-bold uppercase">Status: {valveStateZone1 ? 'Irrigating' : 'Idle'}</p>
								</div>
								<button 
									onclick={() => { valveStateZone1 = !valveStateZone1; saveValves(); }}
									class={['px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all',
										valveStateZone1 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary-green text-white hover:bg-dark-green']}
								>
									{valveStateZone1 ? 'STOP WATER' : 'START WATER'}
								</button>
							</div>

							<div class="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
								<div>
									<h4 class="font-bold text-slate-800">Zone 2: Berries</h4>
									<p class="text-[10px] text-slate-400 mt-1 font-bold uppercase">Status: {valveStateZone2 ? 'Irrigating' : 'Idle'}</p>
								</div>
								<button 
									onclick={() => { valveStateZone2 = !valveStateZone2; saveValves(); }}
									class={['px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all',
										valveStateZone2 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary-green text-white hover:bg-dark-green']}
								>
									{valveStateZone2 ? 'STOP WATER' : 'START WATER'}
								</button>
							</div>

							<div class="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
								<div>
									<h4 class="font-bold text-slate-800">Zone 3: Greenhouses</h4>
									<p class="text-[10px] text-slate-400 mt-1 font-bold uppercase">Status: {valveStateZone3 ? 'Irrigating' : 'Idle'}</p>
								</div>
								<button 
									onclick={() => { valveStateZone3 = !valveStateZone3; saveValves(); }}
									class={['px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all',
										valveStateZone3 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary-green text-white hover:bg-dark-green']}
								>
									{valveStateZone3 ? 'STOP WATER' : 'START WATER'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Right Panel: Upcoming Runs and Weather Widget (4 cols) -->
		<div class="lg:col-span-4 space-y-6">
			<!-- Upcoming Runs -->
			<div class="glass-card rounded-2xl p-6 space-y-5 bg-white">
				<div class="flex items-center justify-between">
					<h3 class="font-extrabold text-slate-800 text-base">Upcoming Runs</h3>
					<span class="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">Weekly</span>
				</div>
				<div class="space-y-4">
					{#each upcomingRuns as run (run.id)}
						<div class="flex gap-4 items-center">
							<div class="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
								<p class="text-[9px] font-black text-slate-400 leading-none">OCT</p>
								<p class="text-base font-black text-slate-800 leading-none mt-1">{run.day}</p>
							</div>
							<div>
								<p class="text-xs font-bold text-slate-850 leading-tight">{run.zone}</p>
								<p class="text-[10px] text-slate-400 font-semibold mt-1">{run.details}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Recent Activities -->
			<div class="glass-card rounded-2xl p-6 space-y-5 bg-white">
				<h3 class="font-extrabold text-slate-800 text-base">Recent Activity</h3>
				<div class="relative space-y-6">
					<!-- Timeline vertical connector -->
					<div class="absolute left-5 top-2 bottom-2 w-[1.5px] bg-slate-100"></div>

					{#each activities as act (act.id)}
						<div class="flex gap-4 items-center relative z-10">
							<div class={['size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100/50', act.colorClass]}>
								<span class="material-symbols-outlined text-[16px]">{act.icon}</span>
							</div>
							<div>
								<p class="text-xs font-bold text-slate-800 leading-tight">{act.title}</p>
								<p class="text-[10px] text-slate-400 font-semibold mt-1">{act.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Weather Widget Card overlaying field imagery -->
			<div class="relative h-60 rounded-2xl overflow-hidden glass-card group border-0 shadow-sm">
				<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style='background-image: url("https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80");'></div>
				<div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-0"></div>
				
				<div class="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-1.5 z-10 text-white">
					<div class="flex items-center gap-2">
						<span class="material-symbols-outlined text-white text-3xl filled">cloudy_snowing</span>
						<p class="text-3xl font-light">72°<span class="text-sm font-semibold">F</span></p>
					</div>
					<p class="text-xs font-bold text-white/90">Precipitation: 20% today</p>
					<p class="text-[9px] font-black text-white/70 uppercase tracking-wider mt-1.5">Local Weather: Napa Valley</p>
				</div>
			</div>
		</div>

	</div>
</section>
