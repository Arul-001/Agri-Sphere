/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/irrigation');
		if (res.ok) {
			return await res.json();
		}
	} catch (err) {
		console.error('Error in irrigation page server loader:', err);
	}
	return {
		scheduleRuns: [],
		upcomingRuns: [],
		activities: [],
		valves: { zone1: false, zone2: false, zone3: false }
	};
}
