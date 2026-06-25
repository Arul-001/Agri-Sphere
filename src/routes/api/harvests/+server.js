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
		const snapshot = await adminDb.collection('harvests')
			.where('farmerId', '==', locals.user.uid)
			.get();
		
		let harvests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Seed initial harvest logs if empty
		if (harvests.length === 0) {
			const seedHarvests = [
				{
					cropName: 'Basmati Rice',
					quantity: 90,
					unit: 'Quintals',
					harvestDate: '2026-06-24',
					qualityGrade: 'Grade A',
					notes: 'Premium yield from North Valley fields.',
					farmerId: locals.user.uid,
					createdAt: new Date().toISOString()
				},
				{
					cropName: 'Sweet Corn',
					quantity: 45,
					unit: 'Quintals',
					harvestDate: '2026-06-18',
					qualityGrade: 'Grade A+',
					notes: 'Excellent moisture content and grain quality.',
					farmerId: locals.user.uid,
					createdAt: new Date().toISOString()
				}
			];

			for (const item of seedHarvests) {
				const docRef = await adminDb.collection('harvests').add(item);
				harvests.push({ id: docRef.id, ...item });
			}
		}

		return json(harvests);
	} catch (error) {
		console.error('Error fetching harvests:', error);
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
		const { cropName, quantity, unit, harvestDate, qualityGrade, notes } = body;

		// Manual Validation
		if (!cropName || typeof cropName !== 'string' || cropName.trim().length === 0) {
			return json({ error: 'Crop name is required' }, { status: 400 });
		}
		if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
			return json({ error: 'Quantity must be a positive number' }, { status: 400 });
		}
		if (!harvestDate || typeof harvestDate !== 'string') {
			return json({ error: 'Harvest date is required' }, { status: 400 });
		}

		const newHarvest = {
			cropName,
			quantity: Number(quantity),
			unit: unit || 'Quintals',
			harvestDate,
			qualityGrade: qualityGrade || 'Grade A',
			notes: notes || '',
			farmerId: locals.user.uid,
			createdAt: new Date().toISOString()
		};

		const docRef = await adminDb.collection('harvests').add(newHarvest);
		return json({ id: docRef.id, ...newHarvest }, { status: 201 });
	} catch (error) {
		console.error('Error creating harvest log:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
