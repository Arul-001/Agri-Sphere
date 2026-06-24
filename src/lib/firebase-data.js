import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updateProfile,
	sendPasswordResetEmail
} from 'firebase/auth';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	onSnapshot,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	query
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, googleProvider, storage } from './firebase';

export const taskStatuses = ['todo', 'doing', 'done'];

function readableDate(value) {
	const date = value?.toDate?.();
	return date ? date.toLocaleString() : 'Just now';
}

function createdAtMillis(value) {
	return value?.toDate?.()?.getTime?.() || 0;
}

function mapSnapshot(snapshot) {
	return snapshot.docs
		.map((item) => {
			const data = item.data();

			return {
				id: item.id,
				...data,
				createdAtLabel: readableDate(data.createdAt),
				createdAtMillis: createdAtMillis(data.createdAt)
			};
		})
		.sort((a, b) => b.createdAtMillis - a.createdAtMillis);
}

export function roleHome(role) {
	if (role === 'admin') return '/admin/dashboard';
	if (role === 'farmer') return '/farmer/dashboard';
	return '/buyer/dashboard';
}

export async function ensureUserDocument(user, fallback = {}) {
	const userRef = doc(db, 'users', user.uid);
	const existing = await getDoc(userRef);

	if (existing.exists()) {
		const data = existing.data();
		if (data.role === 'student') {
			await updateDoc(userRef, { role: 'farmer' });
		}
		return;
	}

	const role = fallback.role || 'farmer';
	const baseData = {
		fullName: fallback.fullName || user.displayName || 'User',
		email: user.email,
		role,
		phone: fallback.phone || '',
		createdAt: serverTimestamp()
	};

	if (role === 'farmer') {
		baseData.farmName = fallback.farmName || '';
		baseData.farmArea = fallback.farmArea || '';
		baseData.address = fallback.address || '';
	} else if (role === 'buyer') {
		baseData.address = fallback.address || '';
	} else if (role === 'admin') {
		baseData.adminAccessCode = fallback.adminAccessCode || '';
	}

	await setDoc(userRef, baseData);
}

export async function signUpWithEmail({ fullName, email, password, role, ...extra }) {
	const credential = await createUserWithEmailAndPassword(auth, email, password);
	await updateProfile(credential.user, { displayName: fullName });
	await ensureUserDocument(credential.user, { fullName, role, ...extra });
	return credential.user;
}

export async function loginWithEmail({ email, password }) {
	const credential = await signInWithEmailAndPassword(auth, email, password);
	await ensureUserDocument(credential.user);
	return credential.user;
}

export async function loginWithGoogle() {
	const credential = await signInWithPopup(auth, googleProvider);
	await ensureUserDocument(credential.user);
	return credential.user;
}

export function logout() {
	return signOut(auth);
}

export function subscribeStudents(callback) {
	return onSnapshot(collection(db, 'users'), (snapshot) => {
		const students = mapSnapshot(snapshot)
			.filter((user) => user.role === 'farmer')
			.sort((a, b) => a.fullName.localeCompare(b.fullName));

		callback(students);
	});
}

export function subscribeUsers(callback) {
	return onSnapshot(collection(db, 'users'), (snapshot) => {
		callback(mapSnapshot(snapshot));
	});
}

export function subscribeTasks(callback) {
	return onSnapshot(collection(db, 'tasks'), (snapshot) => {
		callback(mapSnapshot(snapshot));
	});
}

export function subscribeTasksForUser(userId, callback) {
	const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));

	return onSnapshot(tasksQuery, (snapshot) => {
		callback(mapSnapshot(snapshot));
	});
}

export async function createTask({ title, description, user }) {
	await addDoc(collection(db, 'tasks'), {
		title,
		description,
		status: 'todo',
		userId: user.id,
		userName: user.fullName,
		userEmail: user.email,
		createdAt: serverTimestamp()
	});
}

export async function updateTaskStatus(taskId, status) {
	await updateDoc(doc(db, 'tasks', taskId), {
		status,
		updatedAt: serverTimestamp()
	});
}

export async function deleteTask(taskId) {
	await deleteDoc(doc(db, 'tasks', taskId));
}

export function subscribeFiles(callback) {
	return onSnapshot(collection(db, 'files'), (snapshot) => {
		callback(mapSnapshot(snapshot));
	});
}

export async function uploadSharedFile(file, uploadedBy) {
	const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
	const path = `shared-files/${Date.now()}-${safeName}`;
	const fileRef = ref(storage, path);

	await uploadBytes(fileRef, file);
	const url = await getDownloadURL(fileRef);

	await addDoc(collection(db, 'files'), {
		name: file.name,
		path,
		url,
		size: file.size,
		type: file.type || 'application/octet-stream',
		uploadedBy: uploadedBy?.email || 'admin',
		createdAt: serverTimestamp()
	});
}

export async function deleteSharedFile(file) {
	await deleteObject(ref(storage, file.path));
	await deleteDoc(doc(db, 'files', file.id));
}

export async function resetPassword(email) {
	await sendPasswordResetEmail(auth, email);
}
