import { json } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { setSessionCookie, deleteSessionCookie } from '$lib/server/cookies';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const { idToken, profileData } = await request.json();

		if (!idToken || typeof idToken !== 'string') {
			return json({ error: 'Invalid ID token provided' }, { status: 400 });
		}

		// Verify the ID token first
		const decodedIdToken = await adminAuth.verifyIdToken(idToken);
		const uid = decodedIdToken.uid;
		


		// Check if user profile already exists
		const userRef = adminDb.collection('users').doc(uid);
		const userDoc = await userRef.get();

		if (profileData) {
			// Validate role (rename 'buyer' to 'customer' to comply with user requests)
			let role = profileData.role || 'customer';
			if (role === 'buyer') role = 'customer';

			if (!['admin', 'farmer', 'customer'].includes(role)) {
				return json({ error: 'Invalid user role' }, { status: 400 });
			}

			// Construct base document data
			const baseData = {
				fullName: profileData.fullName || decodedIdToken.name || 'User',
				email: profileData.email || decodedIdToken.email,
				role,
				phone: profileData.phone || '',
				createdAt: new Date().toISOString()
			};

			if (role === 'farmer') {
				baseData.farmName = profileData.farmName || '';
				baseData.farmArea = profileData.farmArea ? Number(profileData.farmArea) : 0;
				baseData.address = profileData.address || '';
				baseData.verified = false; // Admin needs to verify
			} else if (role === 'customer') {
				baseData.address = profileData.address || '';
			} else if (role === 'admin') {
				baseData.adminAccessCode = profileData.adminAccessCode || '';
			}

			await userRef.set(baseData);
		} else if (!userDoc.exists) {
			// If logging in (e.g., Google login) and no profile exists, create a default customer profile
			const baseData = {
				fullName: decodedIdToken.name || 'Google User',
				email: decodedIdToken.email,
				role: 'customer',
				phone: '',
				createdAt: new Date().toISOString()
			};
			await userRef.set(baseData);
		}

		// Create session cookie (1 week expiry)
		const expiresIn = 60 * 60 * 24 * 7 * 1000;
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

		// Set the secure cookie
		setSessionCookie(cookies, sessionCookie);

		return json({ success: true, message: 'Session created successfully' }, { status: 200 });
	} catch (error) {
		console.error('Session creation error FULL TRACE:', error);
		return json({ error: error.message || 'Failed to create session' }, { status: 401 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ cookies }) {
	deleteSessionCookie(cookies);
	return json({ success: true, message: 'Session deleted successfully' }, { status: 200 });
}
