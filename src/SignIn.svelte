<script>
    import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";

    let provider = new GoogleAuthProvider();

    let error = null;
    function onButton() {
        signInWithPopup(getAuth(), provider)
            .catch((e) => {
                error = e;
            });
    }
</script>

{#if error != null}
    <p class="errortext">Error code: {error.code} | Message: {error.message}</p>
{/if}

<button on:click={onButton}>Sign in with google</button>
