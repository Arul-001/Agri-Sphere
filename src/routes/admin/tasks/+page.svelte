<script>
	import { createTask, deleteTask, subscribeStudents, subscribeTasks } from '$lib/firebase-data';
	import { onMount } from 'svelte';

	let students = $state([]);
	let tasks = $state([]);
	let selectedUserId = $state('');
	let title = $state('');
	let description = $state('');
	let loading = $state(false);

	let selectedUser = $derived(students.find((student) => student.id === selectedUserId));

	onMount(() => {
		const unsubscribeStudents = subscribeStudents((items) => {
			students = items;
			selectedUserId ||= items[0]?.id || '';
		});

		const unsubscribeTasks = subscribeTasks((items) => {
			tasks = items;
		});

		return () => {
			unsubscribeStudents();
			unsubscribeTasks();
		};
	});

	async function submitTask(event) {
		event.preventDefault();
		loading = true;

		await createTask({ title, description, user: selectedUser });
		title = '';
		description = '';
		loading = false;
	}

	async function removeTask(taskId) {
		await deleteTask(taskId);
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		<div>
			<p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
			<h1 class="mt-2 text-3xl font-bold text-slate-950">Tasks</h1>
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
			<form class="rounded-md border border-slate-200 bg-white p-5 shadow-sm" onsubmit={submitTask}>
				<h2 class="text-xl font-semibold text-slate-950">Create task</h2>

				<div class="mt-5 space-y-4">
					<label class="block">
						<span class="text-sm font-medium text-slate-700">Farmer</span>
						<select bind:value={selectedUserId} required class="mt-1 w-full rounded-md border-slate-300">
							{#each students as student (student.id)}
								<option value={student.id}>{student.fullName} ({student.email})</option>
							{/each}
						</select>
					</label>

					<label class="block">
						<span class="text-sm font-medium text-slate-700">Title</span>
						<input
							type="text"
							bind:value={title}
							required
							class="mt-1 w-full rounded-md border-slate-300"
							placeholder="Read Firestore docs"
						/>
					</label>

					<label class="block">
						<span class="text-sm font-medium text-slate-700">Description</span>
						<textarea
							bind:value={description}
							required
							rows="5"
							class="mt-1 w-full rounded-md border-slate-300"
							placeholder="Add instructions for the farmer"
						></textarea>
					</label>

					<div class="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
						New tasks are saved with status <strong>todo</strong>.
					</div>

					<button
						type="submit"
						disabled={loading || !selectedUser}
						class="w-full rounded-md bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? 'Creating...' : 'Create Task'}
					</button>
				</div>
			</form>

			<div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
				<h2 class="text-xl font-semibold text-slate-950">All tasks</h2>

				<div class="mt-4 divide-y divide-slate-100">
					{#each tasks as task (task.id)}
						<div class="py-4">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="font-semibold text-slate-950">{task.title}</p>
									<p class="mt-1 text-sm text-slate-500">{task.userName} ({task.userEmail})</p>
									<p class="mt-2 text-sm text-slate-600">{task.description}</p>
								</div>
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
										{task.status}
									</span>
									<button
										type="button"
										onclick={() => removeTask(task.id)}
										class="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					{:else}
						<p class="py-6 text-center text-slate-500">No tasks created yet.</p>
					{/each}
				</div>
			</div>
		</div>
	</section>
