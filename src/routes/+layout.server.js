export function load({ cookies }) {
	return {
		role: cookies.get('firebase_role') || '',
		uid: cookies.get('firebase_uid') || ''
	};
}
