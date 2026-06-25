import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const docRef = adminDb.collection('products').doc(params.id);
		const productDoc = await docRef.get();

		if (!productDoc.exists) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		return json({ id: productDoc.id, ...productDoc.data() });
	} catch (error) {
		console.error('Error fetching product details:', error);
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
		const docRef = adminDb.collection('products').doc(params.id);
		const productDoc = await docRef.get();

		if (!productDoc.exists) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (productDoc.data().farmerId !== locals.user.uid) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { name, category, price, size, description, imageUrl, status } = body;

		// Manual Validation
		if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
			return json({ error: 'Product name must be a non-empty string' }, { status: 400 });
		}
		if (price !== undefined && (typeof price !== 'string' || price.trim().length === 0)) {
			return json({ error: 'Price must be a non-empty string' }, { status: 400 });
		}
		if (size !== undefined && (typeof size !== 'string' || size.trim().length === 0)) {
			return json({ error: 'Size must be a non-empty string' }, { status: 400 });
		}
		if (status !== undefined && !['Available', 'Sold'].includes(status)) {
			return json({ error: 'Status must be Available or Sold' }, { status: 400 });
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = name;
		if (category !== undefined) updatePayload.category = category;
		if (price !== undefined) updatePayload.price = price;
		if (size !== undefined) updatePayload.size = size;
		if (description !== undefined) updatePayload.description = description;
		if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
		if (status !== undefined) updatePayload.status = status;

		await docRef.update(updatePayload);
		const updatedDoc = await docRef.get();

		return json({ id: updatedDoc.id, ...updatedDoc.data() });
	} catch (error) {
		console.error('Error updating product listing:', error);
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
		const docRef = adminDb.collection('products').doc(params.id);
		const productDoc = await docRef.get();

		if (!productDoc.exists) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (productDoc.data().farmerId !== locals.user.uid) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		await docRef.delete();
		return json({ success: true, message: 'Product listing deleted successfully' });
	} catch (error) {
		console.error('Error deleting product listing:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
