import App from './App.svelte';
import { user } from './stores';

const auth = getAuth();
if (location.hostname === "localhost") {
	connectAuthEmulator(auth, "http://localhost:9099");
}
onAuthStateChanged(auth, (newUser) => {
	if (newUser) {
		user.set(newUser);
	} else {
		user.set(null);
	}
});

var app = new App({
	target: document.body
});

export default app;