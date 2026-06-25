const SESSION_COOKIE_NAME = '__session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 1 week

/**
 * Sets a secure HTTP-only session cookie
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} token - The Firebase ID token or session cookie
 */
export function setSessionCookie(cookies, token) {
	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: MAX_AGE_SECONDS
	});
}

/**
 * Retrieves the current session cookie
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {string | undefined}
 */
export function getSessionCookie(cookies) {
	return cookies.get(SESSION_COOKIE_NAME);
}

/**
 * Deletes the session cookie
 * @param {import('@sveltejs/kit').Cookies} cookies
 */
export function deleteSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
}

/**
 * Refreshes the session cookie max age
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} token
 */
export function refreshSessionCookie(cookies, token) {
	setSessionCookie(cookies, token);
}
