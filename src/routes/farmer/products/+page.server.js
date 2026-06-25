/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, locals }) {
	if (!locals.user) return { products: [] };
	try {
		const res = await fetch(`/api/products?farmerId=${locals.user.uid}`);
		if (res.ok) {
			const products = await res.json();
			return { products };
		}
	} catch (err) {
		console.error('Error in farmer products page server loader:', err);
	}
	return { products: [] };
}
