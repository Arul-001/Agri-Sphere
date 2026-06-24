<script>
	import { authState } from '$lib/auth.svelte.js';
	import { deleteSharedFile, subscribeFiles, uploadSharedFile } from '$lib/firebase-data';
	import { onMount } from 'svelte';

	let files = $state([]);
	let selectedFiles = $state();
	let uploading = $state(false);

	let selectedFile = $derived(selectedFiles?.[0]);

	onMount(() => {
		return subscribeFiles((items) => {
			files = items;
		});
	});

	function formatBytes(bytes = 0) {
		if (bytes < 1024) {
			return `${bytes} B`;
		}

		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		}

		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	async function submitFile(event) {
		event.preventDefault();
		uploading = true;

		await uploadSharedFile(selectedFile, authState.user);
		selectedFiles = new DataTransfer().files;
		uploading = false;
	}

	async function removeFile(file) {
		await deleteSharedFile(file);
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		<div>
			<p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
			<h1 class="mt-2 text-3xl font-bold text-slate-950">Files</h1>
		</div>

		<form class="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm" onsubmit={submitFile}>
			<h2 class="text-xl font-semibold text-slate-950">Upload file</h2>
			<div class="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
				<label class="block">
					<span class="text-sm font-medium text-slate-700">Choose file</span>
					<input
						type="file"
						bind:files={selectedFiles}
						required
						class="mt-1 w-full rounded-md border-slate-300"
					/>
				</label>

				<button
					type="submit"
					disabled={uploading || !selectedFile}
					class="rounded-md bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{uploading ? 'Uploading...' : 'Upload'}
				</button>
			</div>

			{#if selectedFile}
				<p class="mt-3 text-sm text-slate-500">
					Selected {selectedFile.name} ({formatBytes(selectedFile.size)})
				</p>
			{/if}

		</form>

		<div class="mt-6 grid gap-4 md:grid-cols-2">
			{#each files as file (file.id)}
				<article class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p class="text-lg font-semibold text-slate-950">{file.name}</p>
							<p class="mt-2 text-sm text-slate-500">
								{formatBytes(file.size)} - Uploaded {file.createdAtLabel}
							</p>
							<a
								href={file.url}
								target="_blank"
								rel="noreferrer"
								class="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Open
							</a>
						</div>

						<button
							type="button"
							onclick={() => removeFile(file)}
							class="w-fit rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Delete
						</button>
					</div>
				</article>
			{:else}
				<div class="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center md:col-span-2">
					<h2 class="text-xl font-semibold text-slate-950">No files uploaded</h2>
					<p class="mt-2 text-slate-600">Upload a file to make it visible to every student.</p>
				</div>
			{/each}
		</div>
	</section>
