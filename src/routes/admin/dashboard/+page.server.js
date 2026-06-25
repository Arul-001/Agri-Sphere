/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const res = await fetch('/api/dashboard');
		if (res.ok) {
			return await res.json();
		}
	} catch (err) {
		console.error('Error fetching admin dashboard data:', err);
	}
	return {
		users: [],
		logs: []
	};
}
