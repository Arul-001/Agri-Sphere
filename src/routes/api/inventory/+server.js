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
		const snapshot = await adminDb.collection('inventory')
			.where('farmerId', '==', locals.user.uid)
			.get();
		
		let inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Seed initial stock items if empty
		if (inventory.length === 0) {
			const seedInventory = [
				{ name: 'Premium Wheat Seed', category: 'Seeds', icon: 'grass', total: 5000, soldUsed: 1200, unit: 'kg', progress: 76, status: 'Optimal', statusColor: 'bg-emerald-50 text-dark-green border-emerald-100/50', farmerId: locals.user.uid, createdAt: new Date().toISOString() },
				{ name: 'Nitrogen Fertilizer (N20)', category: 'Chemicals', icon: 'science', total: 2000, soldUsed: 1700, unit: 'L', progress: 15, status: 'Low', statusColor: 'bg-red-50 text-red-700 border-red-100/50', farmerId: locals.user.uid, createdAt: new Date().toISOString() },
				{ name: 'Irrigation Drip Tape', category: 'Equipment', icon: 'precision_manufacturing', total: 10000, soldUsed: 4500, unit: 'm', progress: 55, status: 'Optimal', statusColor: 'bg-emerald-50 text-dark-green border-emerald-100/50', farmerId: locals.user.uid, createdAt: new Date().toISOString() },
				{ name: 'Pesticide (Organic)', category: 'Chemicals', icon: 'bug_report', total: 500, soldUsed: 460, unit: 'L', progress: 8, status: 'Warning', statusColor: 'bg-amber-50 text-amber-800 border-amber-100/50', farmerId: locals.user.uid, createdAt: new Date().toISOString() },
				{ name: 'Soybean Seeds', category: 'Seeds', icon: 'eco', total: 8000, soldUsed: 1000, unit: 'kg', progress: 87.5, status: 'Optimal', statusColor: 'bg-emerald-50 text-dark-green border-emerald-100/50', farmerId: locals.user.uid, createdAt: new Date().toISOString() }
			];

			for (const item of seedInventory) {
				const docRef = await adminDb.collection('inventory').add(item);
				inventory.push({ id: docRef.id, ...item });
			}
		}

		return json(inventory);
	} catch (error) {
		console.error('Error fetching inventory:', error);
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
		const { action, itemId, amount, type } = body;

		const query = adminDb.collection('inventory').where('farmerId', '==', locals.user.uid);
		
		if (action === 'replenish') {
			const snapshot = await query.get();
			const batch = adminDb.batch();

			snapshot.docs.forEach(doc => {
				const data = doc.data();
				if (data.status === 'Low' || data.status === 'Warning') {
					const newTotal = Number(data.total || 0) + 2000;
					const available = newTotal - Number(data.soldUsed || 0);
					const progress = Math.min(100, Math.max(0, Math.round((available / newTotal) * 100)));
					
					let status = 'Optimal';
					let statusColor = 'bg-emerald-50 text-dark-green border-emerald-100/50';
					if (progress <= 10) {
						status = 'Low';
						statusColor = 'bg-red-50 text-red-700 border-red-100/50';
					} else if (progress <= 25) {
						status = 'Warning';
						statusColor = 'bg-amber-50 text-amber-800 border-amber-100/50';
					}

					batch.update(doc.ref, {
						total: newTotal,
						progress,
						status,
						statusColor
					});
				}
			});

			await batch.commit();
			return json({ success: true, message: 'Replenished successfully' });
		}

		if (action === 'update_quantity') {
			if (!itemId) {
				return json({ error: 'Item ID is required' }, { status: 400 });
			}
			if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
				return json({ error: 'Amount must be a valid positive number' }, { status: 400 });
			}

			const docRef = adminDb.collection('inventory').doc(itemId);
			const docSnap = await docRef.get();

			if (!docSnap.exists) {
				return json({ error: 'Inventory item not found' }, { status: 404 });
			}

			const data = docSnap.data();
			if (data.farmerId !== locals.user.uid) {
				return json({ error: 'Forbidden' }, { status: 403 });
			}

			let newTotal = Number(data.total || 0);
			let newSoldUsed = Number(data.soldUsed || 0);

			if (type === 'add') {
				newTotal += Number(amount);
			} else {
				newSoldUsed = Math.min(newTotal, newSoldUsed + Number(amount));
			}

			const available = newTotal - newSoldUsed;
			const progress = Math.min(100, Math.max(0, Math.round((available / newTotal) * 100)));
			
			let status = 'Optimal';
			let statusColor = 'bg-emerald-50 text-dark-green border-emerald-100/50';
			if (progress <= 10) {
				status = 'Low';
				statusColor = 'bg-red-50 text-red-700 border-red-100/50';
			} else if (progress <= 25) {
				status = 'Warning';
				statusColor = 'bg-amber-50 text-amber-800 border-amber-100/50';
			}

			const updatePayload = {
				total: newTotal,
				soldUsed: newSoldUsed,
				progress,
				status,
				statusColor
			};

			await docRef.update(updatePayload);
			return json({ id: docRef.id, ...data, ...updatePayload });
		}

		return json({ error: 'Invalid action specified' }, { status: 400 });
	} catch (error) {
		console.error('Error modifying inventory:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
