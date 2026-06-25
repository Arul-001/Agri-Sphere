/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/disease-detection');
		if (res.ok) {
			const history = await res.json();
			return { history };
		}
	} catch (err) {
		console.error('Error in disease-detection page server loader:', err);
	}
	return { history: [] };
}
