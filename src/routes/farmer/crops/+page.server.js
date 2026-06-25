/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/crops');
		if (res.ok) {
			const crops = await res.json();
			return { crops };
		}
	} catch (err) {
		console.error('Error in crops page server loader:', err);
	}
	return { crops: [] };
}
