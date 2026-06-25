import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Returns the default dashboard path for a given role.
 * @param {string} role 
 * @returns {string}
 */
export function roleHome(role) {
	if (role === 'admin') return '/admin/dashboard';
	if (role === 'farmer') return '/farmer/dashboard';
	return '/customer/dashboard';
}

/**
 * Triggers client-side logout using Firebase Client SDK
 * @returns {Promise<void>}
 */
export function logout() {
	return signOut(auth);
}

/**
 * Triggers client-side password reset email request
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
	await sendPasswordResetEmail(auth, email);
}
