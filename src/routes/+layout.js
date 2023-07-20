// These two configuration options make it so our entire site is a client-side
// only application. This means distributing it can be done on most any hosting
// platform, and it also keeps our user's information private to them (anything
// stored lives in their own browser's localStorage).
export const prerender = false
export const ssr = false
