import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

// Diagnostic preset database mapping
const DIAGNOSTIC_PRESETS = {
	tomato: {
		pathogen: 'Tomato Early Blight',
		confidence: 94,
		severity: 'Moderate',
		severityColor: 'bg-amber-500',
		severityTextColor: 'text-amber-800 bg-amber-50 border-amber-100/50',
		treatment: 'Apply copper-based fungicide immediately. Ensure proper spacing between plants to improve air circulation. Remove and destroy affected lower leaves to prevent upward spread.',
		field: 'Tomato - Field Block A'
	},
	potato_unhealthy: {
		pathogen: 'Potato Late Blight',
		confidence: 88,
		severity: 'High',
		severityColor: 'bg-red-500',
		severityTextColor: 'text-red-700 bg-red-50 border-red-100/50',
		treatment: 'Destroy infected plants immediately to prevent infestation of adjacent areas. Apply protective chlorothalonil or mancozeb fungicides on remaining healthy plants. Avoid overhead irrigation.',
		field: 'Potato - Field B'
	},
	wheat_healthy: {
		pathogen: 'Healthy (No Disease Detected)',
		confidence: 99,
		severity: 'None',
		severityColor: 'bg-primary-green',
		severityTextColor: 'text-dark-green bg-emerald-50 border-emerald-100/50',
		treatment: 'No active pathogens detected. Maintain standard nitrogen fertilization schedule and monitor soil moisture levels regularly.',
		field: 'Wheat - North Plateau'
	}
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.profile?.role !== 'farmer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const snapshot = await adminDb.collection('disease_scans')
			.where('farmerId', '==', locals.user.uid)
			.get();
		
		let scans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Seed initial history if empty
		if (scans.length === 0) {
			const seedScans = [
				{
					crop: 'Potato - Field B',
					pathogen: 'Potato Late Blight',
					confidence: 88,
					severity: 'High',
					statusColor: 'text-red-700 bg-red-50 border-red-100/50',
					time: '2h ago',
					image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80',
					farmerId: locals.user.uid,
					createdAt: new Date().toISOString()
				}
			];

			for (const item of seedScans) {
				const docRef = await adminDb.collection('disease_scans').add(item);
				scans.push({ id: docRef.id, ...item });
			}
		}

		// Sort by createdAt descending
		scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return json(scans);
	} catch (error) {
		console.error('Error fetching scan history:', error);
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
		const { presetId, imageUrl } = body;

		if (!presetId || !DIAGNOSTIC_PRESETS[presetId]) {
			return json({ error: 'Invalid preset ID' }, { status: 400 });
		}

		const diagnosis = DIAGNOSTIC_PRESETS[presetId];
		const statusColor = diagnosis.pathogen.includes('Healthy')
			? 'text-dark-green bg-emerald-50 border-emerald-100/50'
			: diagnosis.severity === 'High'
				? 'text-red-700 bg-red-50 border-red-100/50'
				: 'text-amber-800 bg-amber-50 border-amber-100/50';

		const newScan = {
			crop: diagnosis.field,
			pathogen: diagnosis.pathogen,
			confidence: diagnosis.confidence,
			severity: diagnosis.severity,
			statusColor,
			time: 'Just now',
			image: imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80',
			farmerId: locals.user.uid,
			createdAt: new Date().toISOString()
		};

		const docRef = await adminDb.collection('disease_scans').add(newScan);
		return json({ id: docRef.id, ...newScan });
	} catch (error) {
		console.error('Error saving diagnosis:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
