/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/inventory');
		if (res.ok) {
			const inventory = await res.json();
			return { inventory };
		}
	} catch (err) {
		console.error('Error in inventory page server loader:', err);
	}
	return { inventory: [] };
}
