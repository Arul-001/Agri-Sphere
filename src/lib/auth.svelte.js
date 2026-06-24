import { browser } from '$app/environment';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ensureUserDocument } from './firebase-data';

export const authState = $state({
	user: null,
	profile: null,
	loading: true,
	error: ''
});

let started = false;
let unsubscribeProfile;

function setCookie(name, value) {
	document.cookie = `${name}=${value}; path=/; max-age=604800; SameSite=Lax`;
}

function clearCookie(name) {
	document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function startAuthListener() {
	if (!browser || started) {
		return;
	}

	started = true;

	onAuthStateChanged(auth, async (user) => {
		unsubscribeProfile?.();
		authState.user = user;
		authState.profile = null;
		authState.error = '';

		if (!user) {
			clearCookie('firebase_uid');
			clearCookie('firebase_role');
			authState.loading = false;
			return;
		}

		authState.loading = true;

		try {
			await ensureUserDocument(user);

			unsubscribeProfile = onSnapshot(
				doc(db, 'users', user.uid),
				(snapshot) => {
					authState.profile = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
					setCookie('firebase_uid', user.uid);
					setCookie('firebase_role', authState.profile?.role || 'farmer');
					authState.loading = false;
				},
				(error) => {
					authState.error = error.message;
					authState.loading = false;
				}
			);
		} catch (error) {
			authState.error = error.message;
			authState.loading = false;
		}
	});
}
