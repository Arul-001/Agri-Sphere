import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { farmerUid } = body;

		if (!farmerUid || typeof farmerUid !== 'string') {
			return json({ error: 'Farmer UID is required' }, { status: 400 });
		}

		const userRef = adminDb.collection('users').doc(farmerUid);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return json({ error: 'Farmer profile not found' }, { status: 404 });
		}

		if (userDoc.data().role !== 'farmer') {
			return json({ error: 'Selected user is not a farmer' }, { status: 400 });
		}

		await userRef.update({ verified: true });
		return json({ success: true, message: 'Farmer profile verified successfully' });
	} catch (error) {
		console.error('Error verifying farmer profile:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
