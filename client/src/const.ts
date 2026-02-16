export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login page URL. No more Manus OAuth portal —
 * auth is handled by our own /login page with Google OAuth + email/password.
 */
export const getLoginUrl = () => "/login";
