import { redirect } from '@sveltejs/kit';

const VALID_ROLES = ['admin', 'farmer', 'buyer'];

function homeForRole(role) {
	if (role === 'admin') return '/admin/dashboard';
	if (role === 'farmer') return '/farmer/dashboard';
	if (role === 'buyer') return '/buyer/dashboard';
	return '/login';
}

export async function handle({ event, resolve }) {
	let role = event.cookies.get('firebase_role');
	const path = event.url.pathname;

	// Prevent cookie corruption or stale roles (like 'student') from causing redirect loops
	if (role && !VALID_ROLES.includes(role)) {
		event.cookies.delete('firebase_role', { path: '/' });
		event.cookies.delete('firebase_uid', { path: '/' });
		role = undefined;
	}

	if (path.startsWith('/admin') || path.startsWith('/farmer') || path.startsWith('/buyer')) {
		if (!role) {
			redirect(303, '/login');
		}

		if (path.startsWith('/admin') && role !== 'admin') {
			redirect(303, homeForRole(role));
		}

		if (path.startsWith('/farmer') && role !== 'farmer') {
			redirect(303, homeForRole(role));
		}

		if (path.startsWith('/buyer') && role !== 'buyer') {
			redirect(303, homeForRole(role));
		}
	}

	const isGuestRoute = path === '/' || path === '/login' || path === '/signup' || path === '/select-role' || path === '/forgot-password';
	if (isGuestRoute && role) {
		redirect(303, homeForRole(role));
	}

	return resolve(event);
}