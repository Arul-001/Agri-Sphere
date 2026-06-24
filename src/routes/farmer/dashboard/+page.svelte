<script>
	import { onMount } from 'svelte';
	import { authState } from '$lib/auth.svelte.js';
	import { subscribeTasksForUser } from '$lib/firebase-data';

	let tasks = $state([]);
	let financialChartInstance;
	let cropChartInstance;

	$effect(() => {
		if (!authState.profile?.id) return;
		
		// Subscribe to actual tasks if any are assigned to the farmer
		return subscribeTasksForUser(authState.profile.id, (items) => {
			tasks = items;
		});
	});

	// Weather data state
	let weatherTemp = $state(32);
	let soilMoisture = $state('Optimal');
	let humidity = $state(45);
	let windSpeed = $state(12);

	onMount(() => {
		// Initialize Chart.js once loaded from layout.svelte
		const interval = setInterval(() => {
			if (typeof Chart !== 'undefined') {
				clearInterval(interval);
				initCharts();
			}
		}, 100);

		return () => {
			clearInterval(interval);
			financialChartInstance?.destroy();
			cropChartInstance?.destroy();
		};
	});

	function initCharts() {
		// Financial Overview Chart (Mixed Line/Bar)
		const ctxFin = document.getElementById('financialChart')?.getContext('2d');
		if (ctxFin) {
			financialChartInstance = new Chart(ctxFin, {
				type: 'bar',
				data: {
					labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
					datasets: [
						{
							type: 'line',
							label: 'Expense Trend',
							data: [3200, 3500, 3100, 4200, 3800, 4000, 4200],
							borderColor: '#ba1a1a', // error
							borderWidth: 2.5,
							tension: 0.4,
							pointBackgroundColor: '#ffffff',
							pointBorderColor: '#ba1a1a',
							pointRadius: 4,
							fill: false
						},
						{
							type: 'bar',
							label: 'Monthly Profit',
							data: [5000, 6200, 5800, 7100, 6900, 8000, 8500],
							backgroundColor: '#16A34A', // primary-green
							borderRadius: 8,
							barPercentage: 0.55
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false }
					},
					scales: {
						y: {
							beginAtZero: true,
							grid: { color: 'rgba(226, 226, 226, 0.3)' }
						},
						x: {
							grid: { display: false }
						}
					}
				}
			});
		}

		// Crop Performance Doughnut Chart
		const ctxCrop = document.getElementById('cropChart')?.getContext('2d');
		if (ctxCrop) {
			cropChartInstance = new Chart(ctxCrop, {
				type: 'doughnut',
				data: {
					labels: ['Wheat', 'Rice', 'Barley', 'Maize'],
					datasets: [{
						data: [40, 30, 18, 12],
						backgroundColor: [
							'#15803D', // dark-green
							'#16A34A', // primary-green
							'#86EFAC', // secondary-green
							'#DCFCE7'  // light-green
						],
						borderWidth: 0,
						hoverOffset: 6
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '70%',
					plugins: {
						legend: {
							position: 'bottom',
							labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
						}
					}
				}
			});
		}
	}
</script>

<svelte:head>
	<title>Farmer Dashboard - AgriConnect</title>
</svelte:head>

<section class="max-w-[1440px] mx-auto space-y-6">
	
	<!-- Header Banner -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
		<div>
			<h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
			<p class="text-sm text-slate-500 mt-1">Good morning. Here is what is happening on the farm today.</p>
		</div>
		<div class="flex gap-2.5">
			<button class="glass-card px-4 py-2 rounded-2xl text-xs font-bold text-dark-green flex items-center gap-1.5 hover:bg-emerald-50/50">
				<span class="material-symbols-outlined text-[18px]">calendar_month</span>
				<span>This Month</span>
			</button>
			<button class="bg-gradient-to-br from-primary-green to-dark-green text-white px-5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary-green/20 hover:shadow-primary-green/30">
				<span class="material-symbols-outlined text-[18px]">download</span>
				<span>Export Report</span>
			</button>
		</div>
	</div>

	<!-- Bento Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
		
		<!-- Active Crops -->
		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary-green">
					<span class="material-symbols-outlined text-[22px]">psychology</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
					<span class="material-symbols-outlined text-[12px]">arrow_upward</span> 12%
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Harvests</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">4 Crops</h3>
			</div>
		</div>

		<!-- Total Expenses -->
		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
					<span class="material-symbols-outlined text-[22px]">payments</span>
				</div>
				<span class="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
					<span class="material-symbols-outlined text-[12px]">arrow_upward</span> 5%
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">₹32,400</h3>
			</div>
		</div>

		<!-- Available Stock -->
		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
					<span class="material-symbols-outlined text-[22px]">inventory_2</span>
				</div>
				<span class="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
					Stable
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Stock</p>
				<h3 class="text-2xl font-extrabold text-slate-800 mt-1">2,450 <span class="text-xs text-slate-400 font-bold uppercase">kg</span></h3>
			</div>
		</div>

		<!-- Monthly Profit -->
		<div class="glass-card rounded-2xl p-6 flex flex-col justify-between h-36">
			<div class="flex justify-between items-start">
				<div class="size-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
					<span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
				</div>
				<span class="bg-emerald-100 text-dark-green px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
					<span class="material-symbols-outlined text-[12px]">arrow_upward</span> 18%
				</span>
			</div>
			<div>
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Profit</p>
				<h3 class="text-2xl font-extrabold text-primary-green mt-1">₹85,200</h3>
			</div>
		</div>

	</div>

	<!-- Charts Grid (Asymmetric) -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Financial Chart -->
		<div class="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col h-96">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Financial Overview</h3>
				<div class="flex gap-4 text-xs font-semibold text-slate-500">
					<span class="flex items-center"><span class="size-2.5 rounded-full bg-primary-green mr-1.5"></span> Profit</span>
					<span class="flex items-center"><span class="size-2.5 rounded-full bg-red-600 mr-1.5"></span> Expense</span>
				</div>
			</div>
			<div class="flex-grow relative">
				<canvas id="financialChart"></canvas>
			</div>
		</div>

		<!-- Crop Doughnut Chart -->
		<div class="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col h-96">
			<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Crop Yield Share</h3>
			<div class="flex-grow relative">
				<canvas id="cropChart"></canvas>
			</div>
		</div>

	</div>

	<!-- Activities Table & Weather Widget -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Recent Activities -->
		<div class="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col overflow-hidden">
			<div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
				<h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Farm Logs</h3>
				<button class="text-primary-green font-bold text-xs hover:underline">View All</button>
			</div>
			
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse text-xs">
					<thead>
						<tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
							<th class="py-2.5">Activity</th>
							<th class="py-2.5">Date / Time</th>
							<th class="py-2.5">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 text-slate-600 font-medium">
						<tr class="hover:bg-slate-50/50 transition-colors">
							<td class="py-3.5">
								<div class="flex items-center gap-3">
									<div class="size-8 rounded-full bg-emerald-50 text-primary-green flex items-center justify-center">
										<span class="material-symbols-outlined text-[16px]">water_drop</span>
									</div>
									<div>
										<p class="font-bold text-slate-800">Drip Irrigation Activated</p>
										<p class="text-[10px] text-slate-400">Field Block A (Wheat)</p>
									</div>
								</div>
							</td>
							<td class="py-3.5 text-slate-400">Today, 08:30 AM</td>
							<td class="py-3.5"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-100">Optimal</span></td>
						</tr>
						<tr class="hover:bg-slate-50/50 transition-colors">
							<td class="py-3.5">
								<div class="flex items-center gap-3">
									<div class="size-8 rounded-full bg-emerald-50 text-dark-green flex items-center justify-center">
										<span class="material-symbols-outlined text-[16px]">agriculture</span>
									</div>
									<div>
										<p class="font-bold text-slate-800">Basmati Harvest Logged</p>
										<p class="text-[10px] text-slate-400">North Valley • 90 Quintals</p>
									</div>
								</div>
							</td>
							<td class="py-3.5 text-slate-400">Yesterday, 02:15 PM</td>
							<td class="py-3.5"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-100">Completed</span></td>
						</tr>
						<tr class="hover:bg-slate-50/50 transition-colors">
							<td class="py-3.5">
								<div class="flex items-center gap-3">
									<div class="size-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
										<span class="material-symbols-outlined text-[16px]">warning</span>
									</div>
									<div>
										<p class="font-bold text-slate-800">Fertilizer Stock Low</p>
										<p class="text-[10px] text-slate-400">NPK 15-15-15 • Warehouse A</p>
									</div>
								</div>
							</td>
							<td class="py-3.5 text-slate-400">Oct 12, 09:00 AM</td>
							<td class="py-3.5"><span class="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-100">Restock</span></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Weather Micro Widget -->
		<div class="lg:col-span-1 rounded-2xl overflow-hidden relative flex flex-col justify-between min-h-[300px] text-white p-4 shadow-sm border border-slate-200/50 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80');">
			<!-- Glassmorphic panel overlaying current conditions -->
			<div class="relative z-10 w-full h-full p-5 rounded-xl bg-slate-900/30 backdrop-blur-md border border-white/20 flex flex-col justify-between">
				<div class="flex justify-between items-start">
					<div>
						<h3 class="font-extrabold text-base text-white">Farm Conditions</h3>
						<p class="text-[10px] text-white/80 mt-0.5">Central Valley Fields</p>
					</div>
					<span class="material-symbols-outlined text-yellow-300 text-[28px] filled">light_mode</span>
				</div>

				<div>
					<p class="text-5xl font-light tracking-tight leading-none text-white">{weatherTemp}°<span class="text-base font-medium text-white/80">C</span></p>
					<p class="text-xs font-semibold text-white/80 mt-1">Partly Cloudy • Humid</p>
				</div>

				<div class="space-y-2 pt-2 border-t border-white/10">
					<div class="flex justify-between items-center text-[11px] font-semibold text-white/90">
						<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">humidity_mid</span> Humidity</span>
						<span>{humidity}%</span>
					</div>
					<div class="w-full bg-white/25 rounded-full h-1">
						<div class="bg-yellow-300 h-1 rounded-full" style="width: {humidity}%"></div>
					</div>
					<div class="flex justify-between items-center text-[11px] font-semibold text-white/95 pt-0.5">
						<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">air</span> Wind</span>
						<span>{windSpeed} km/h</span>
					</div>
					<div class="flex justify-between items-center text-[11px] font-semibold text-white/95 pt-0.5">
						<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">water_drop</span> Soil Moisture</span>
						<span class="text-yellow-300">{soilMoisture}</span>
					</div>
				</div>
			</div>
		</div>

	</div>

	<!-- Assigned Tasks List from Admin (If any tasks exist) -->
	{#if tasks.length > 0}
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
				📋 Assigned Tasks from Admin
			</h2>
			<div class="grid gap-4 md:grid-cols-2">
				{#each tasks as task (task.id)}
					<div class="border border-slate-100 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
						<div>
							<div class="flex items-center justify-between">
								<h3 class="font-bold text-slate-800">{task.title}</h3>
								<span class="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
									{task.status}
								</span>
							</div>
							<p class="text-xs text-slate-500 mt-1.5 leading-relaxed">{task.description}</p>
						</div>
						<div class="text-[9px] text-slate-400 font-medium pt-2">
							Assigned {task.createdAtLabel}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

</section>
