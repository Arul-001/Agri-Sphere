/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/dashboard');
		if (res.ok) {
			return await res.json();
		}
	} catch (err) {
		console.error('Error fetching farmer dashboard data:', err);
	}
	return {
		crops: [],
		expenses: [],
		inventory: [],
		weather: {
			temp: 32,
			humidity: 45,
			windSpeed: 12,
			soilMoisture: 'Optimal'
		}
	};
}
