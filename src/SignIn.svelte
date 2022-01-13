<script>
    import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
    import { user } from './stores';

    export let auth;

    let provider = new GoogleAuthProvider();

    let error = null;
    function onButton() {
        signInWithPopup(auth, provider)
            .catch((e) => {
                error = e;
            });
    }
</script>

{#if error != null}
    <p class="errortext">Error code: {error.code} | Message: {error.message}</p>
{/if}

<button on:click={onButton}>Sign in with google</button>
