import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const docRef = adminDb.collection('crops').doc(params.id);
		const cropDoc = await docRef.get();

		if (!cropDoc.exists) {
			return json({ error: 'Crop not found' }, { status: 404 });
		}

		const data = cropDoc.data();
		if (locals.profile?.role !== 'admin' && data.farmerId !== locals.user.uid) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		return json({ id: cropDoc.id, ...data });
	} catch (error) {
		console.error('Error fetching crop:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'farmer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const docRef = adminDb.collection('crops').doc(params.id);
		const cropDoc = await docRef.get();

		if (!cropDoc.exists) {
			return json({ error: 'Crop not found' }, { status: 404 });
		}

		if (cropDoc.data().farmerId !== locals.user.uid) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { name, location, stage, plantedDate, progress, acres, imageUrl } = body;

		// Manual Validation
		if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
			return json({ error: 'Crop name must be a non-empty string' }, { status: 400 });
		}
		if (location !== undefined && (typeof location !== 'string' || location.trim().length === 0)) {
			return json({ error: 'Location must be a non-empty string' }, { status: 400 });
		}
		if (progress !== undefined && (isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
			return json({ error: 'Progress must be a number between 0 and 100' }, { status: 400 });
		}
		if (acres !== undefined && (isNaN(Number(acres)) || Number(acres) <= 0)) {
			return json({ error: 'Acres must be a valid positive number' }, { status: 400 });
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = name;
		if (location !== undefined) updatePayload.location = location;
		if (plantedDate !== undefined) updatePayload.plantedDate = plantedDate;
		if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
		if (acres !== undefined) updatePayload.acres = Number(acres);
		
		if (progress !== undefined) {
			updatePayload.progress = Number(progress);
		}

		if (stage !== undefined) {
			updatePayload.stage = stage;
			let stageColor = 'bg-emerald-50 text-dark-green border-emerald-100/50';
			let statusDot = 'bg-primary-green';

			if (stage === 'Harvest-Ready') {
				stageColor = 'bg-amber-50 text-amber-800 border-amber-100/50';
				statusDot = 'bg-amber-500';
			} else if (stage === 'Flowering Stage') {
				stageColor = 'bg-indigo-50 text-indigo-700 border-indigo-100/50';
				statusDot = 'bg-indigo-500';
			}
			updatePayload.stageColor = stageColor;
			updatePayload.statusDot = statusDot;
		}

		await docRef.update(updatePayload);
		const updatedDoc = await docRef.get();

		return json({ id: updatedDoc.id, ...updatedDoc.data() });
	} catch (error) {
		console.error('Error updating crop:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'farmer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const docRef = adminDb.collection('crops').doc(params.id);
		const cropDoc = await docRef.get();

		if (!cropDoc.exists) {
			return json({ error: 'Crop not found' }, { status: 404 });
		}

		if (cropDoc.data().farmerId !== locals.user.uid) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		await docRef.delete();
		return json({ success: true, message: 'Crop deleted successfully' });
	} catch (error) {
		console.error('Error deleting crop:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
