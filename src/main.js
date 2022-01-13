import App from './App.svelte';
import { user } from './stores';

import { getAuth, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
	apiKey: "AIzaSyDELqLj_TdQaSS46V7GoABf9Jf80qg5Qu0",
	authDomain: "medoyoudo-3998f.firebaseapp.com",
	projectId: "medoyoudo-3998f",
	storageBucket: "medoyoudo-3998f.appspot.com",
	messagingSenderId: "850619333270",
	appId: "1:850619333270:web:3f9f2e8a940c7549d1a0b7",
};
const fiebaseApp = initializeApp(firebaseConfig);

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