<script>
    import {
        GoogleAuthProvider,
        getAuth,
        signInWithPopup,
        connectAuthEmulator,
    } from "firebase/auth";

    export let onUser;

    const auth = getAuth();
    if (location.hostname === "localhost") {
        connectAuthEmulator(auth, "http://localhost:9099");
    }
    let provider = new GoogleAuthProvider();

    let error = null;
    let user = null;
    function onButton() {
        signInWithPopup(auth, provider).then((result) => {
            user = result.user;
            onUser(result.user)
        }).catch((e) => {
            error = e;
            user = null;
        });
    }
</script>


{#if error != null}
    <p class="errortext">Error code: {error.code} | Message: {error.message}</p>
{/if}


{#if user === null}
    <button on:click={onButton}>Sign in with google</button>
{:else}
    <p>Signed in</p>
{/if}
