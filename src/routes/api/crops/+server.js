import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'farmer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const cropsSnapshot = await adminDb.collection('crops')
			.where('farmerId', '==', locals.user.uid)
			.get();
		
		const crops = cropsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		return json(crops);
	} catch (error) {
		console.error('Error fetching crops:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'farmer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { name, location, stage, plantedDate, progress, acres, imageUrl } = body;

		// Manual Validation
		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Crop name is required' }, { status: 400 });
		}
		if (!location || typeof location !== 'string' || location.trim().length === 0) {
			return json({ error: 'Location is required' }, { status: 400 });
		}
		if (!stage || typeof stage !== 'string') {
			return json({ error: 'Stage is required' }, { status: 400 });
		}
		if (progress === undefined || isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100) {
			return json({ error: 'Progress must be a number between 0 and 100' }, { status: 400 });
		}
		if (acres === undefined || isNaN(Number(acres)) || Number(acres) <= 0) {
			return json({ error: 'Acres must be a valid positive number' }, { status: 400 });
		}

		let stageColor = 'bg-emerald-50 text-dark-green border-emerald-100/50';
		let statusDot = 'bg-primary-green';

		if (stage === 'Harvest-Ready') {
			stageColor = 'bg-amber-50 text-amber-800 border-amber-100/50';
			statusDot = 'bg-amber-500';
		} else if (stage === 'Flowering Stage') {
			stageColor = 'bg-indigo-50 text-indigo-700 border-indigo-100/50';
			statusDot = 'bg-indigo-500';
		}

		const newCrop = {
			name,
			location,
			stage,
			stageColor,
			statusDot,
			plantedDate: plantedDate || 'Today',
			progress: Number(progress),
			acres: Number(acres),
			imageUrl: imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
			farmerId: locals.user.uid,
			createdAt: new Date().toISOString()
		};

		const docRef = await adminDb.collection('crops').add(newCrop);
		return json({ id: docRef.id, ...newCrop }, { status: 201 });
	} catch (error) {
		console.error('Error creating crop:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
