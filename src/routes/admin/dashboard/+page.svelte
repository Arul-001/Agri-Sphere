<script>
	import { subscribeTasks, subscribeUsers } from '$lib/firebase-data';
	import { onMount } from 'svelte';

	let users = $state([]);
	let tasks = $state([]);

	let farmers = $derived(users.filter((user) => user.role === 'farmer'));
	let buyers = $derived(users.filter((user) => user.role === 'buyer'));
	let admins = $derived(users.filter((user) => user.role === 'admin'));
	let counts = $derived({
		todo: tasks.filter((task) => task.status === 'todo').length,
		doing: tasks.filter((task) => task.status === 'doing').length,
		done: tasks.filter((task) => task.status === 'done').length
	});

	onMount(() => {
		const unsubscribeUsers = subscribeUsers((items) => {
			users = items;
		});

		const unsubscribeTasks = subscribeTasks((items) => {
			tasks = items;
		});

		return () => {
			unsubscribeUsers();
			unsubscribeTasks();
		};
	});
</script>

<section class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
	<div class="border-b border-emerald-100 pb-5">
		<p class="text-xs font-bold uppercase tracking-wider text-dark-green bg-light-green px-2.5 py-1 rounded-full w-fit">
			Admin Portal ⚙️
		</p>
		<h1 class="text-3xl font-extrabold text-slate-900 mt-2">Platform Control Panel</h1>
		<p class="text-slate-500 text-sm mt-1">Review user roles, platform activity logs, and administrative assignments.</p>
	</div>

	<!-- Stats Grid -->
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{users.length}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Farmers</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{farmers.length}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Buyers</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{buyers.length}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrators</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{admins.length}</p>
		</div>
	</div>

	<div class="mt-6 grid gap-4 sm:grid-cols-3">
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Todo</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{counts.todo}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks In Progress</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{counts.doing}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
			<p class="mt-2 text-3xl font-extrabold text-slate-900">{counts.done}</p>
		</div>
	</div>

	<div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-xl font-bold text-slate-900 mb-4">Recent Task Assignments</h2>
		<div class="divide-y divide-slate-100">
			{#each tasks.slice(0, 5) as task (task.id)}
				<div class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-semibold text-slate-800">{task.title}</p>
						<p class="text-xs text-slate-500 mt-0.5">Assigned to: {task.userName} ({task.userEmail})</p>
					</div>
					<span class="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600 border border-slate-200">
						{task.status}
					</span>
				</div>
			{:else}
				<p class="py-6 text-center text-slate-500">No tasks created yet.</p>
			{/each}
		</div>
	</div>
</section>
