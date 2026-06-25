/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/harvests');
		if (res.ok) {
			const harvests = await res.json();
			return { harvests };
		}
	} catch (err) {
		console.error('Error in harvests page server loader:', err);
	}
	return { harvests: [] };
}
