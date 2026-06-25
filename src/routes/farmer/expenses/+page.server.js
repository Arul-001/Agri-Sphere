/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/expenses');
		if (res.ok) {
			const expenses = await res.json();
			return { expenses };
		}
	} catch (err) {
		console.error('Error in expenses page server loader:', err);
	}
	return { expenses: [] };
}
