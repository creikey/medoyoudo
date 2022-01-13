<script>
	import { initializeApp } from "firebase/app";
	import {
		addDoc,
		collection,
		connectFirestoreEmulator,
		doc,
		getFirestore,
		onSnapshot,
		query,
		updateDoc,
	} from "firebase/firestore";
	import SignIn from "./SignIn.svelte";
	import { user } from "./stores";
	import { DateInput } from "date-picker-svelte";
	import { onDestroy } from "svelte";

	const firebaseConfig = {
		apiKey: "AIzaSyDELqLj_TdQaSS46V7GoABf9Jf80qg5Qu0",
		authDomain: "medoyoudo-3998f.firebaseapp.com",
		projectId: "medoyoudo-3998f",
		storageBucket: "medoyoudo-3998f.appspot.com",
		messagingSenderId: "850619333270",
		appId: "1:850619333270:web:3f9f2e8a940c7549d1a0b7",
	};
	const app = initializeApp(firebaseConfig);
	const db = getFirestore();
	if (location.hostname === "localhost") {
		connectFirestoreEmulator(db, "localhost", 8080);
	}
	let unsub = null; // this sucks
	onDestroy(() => {
		if (unsub !== null) unsub();
	});

	function fromNow(days) {
		let toReturn = new Date();
		toReturn.setDate(new Date().getDate() + days);
		return toReturn;
	}

	let todoList = [];
	let doneList = [];

	let error = "";
	function fmtDate(date) {
		return (
			date.getMonth() +
			1 +
			"/" +
			date.getDate() +
			"/" +
			date.getFullYear()
		);
	}

	let dateInput;
	function added(event) {
		let desc = event.srcElement.elements["description"].value;
		let hours = event.srcElement.elements["hours"].value;
		let minutes = event.srcElement.elements["minutes"].value;

		let totalMinutes = 0;
		if (hours.length > 0) {
			totalMinutes += parseInt(hours) * 60;
		}
		if (minutes.length > 0) {
			totalMinutes += parseInt(minutes);
		}
		2;
		if (totalMinutes <= 0) {
			error = "Without time, there is no change";
			return;
		}
		addDoc(collection(db, "users/" + $user.uid + "/tasks"), {
			text: desc,
			status: false,
			timeLength: totalMinutes,
			due: dateInput,
		})
			.then((result) => {
				error = "";
			})
			.catch((e) => {
				error = "" + e;
			});
		event.srcElement.elements["description"].value = "";
		event.srcElement.elements["hours"].value = "";
		event.srcElement.elements["minutes"].value = "";
		event.srcElement.elements["description"].focus();
		// 		event.srcElement.reset(); can't use this fucks up the date input
	}

	function getHours(t) {
		return Math.floor(t / 60).toFixed();
	}

	function getMinutes(t) {
		return t % 60;
	}

	function setIdStatus(id, newStatus) {
		updateDoc(doc(db, "users/" + $user.uid + "/tasks/" + id), {
			status: newStatus,
		})
			.then(() => {
				error = "";
			})
			.catch((e) => {
				error = "" + e;
			});
	}

	$: unsub = $user
		? onSnapshot(
				query(collection(db, "users/" + $user.uid + "/tasks")),
				(tasks) => {
					let newTodoList = [];
					let newDoneList = [];
					tasks.forEach((doc) => {
						let targetList = newTodoList;
						if (doc.data().status === true) {
							targetList = newDoneList;
						}
						targetList.push({
							id: doc.id,
							text: doc.data().text,
							status: doc.data().status,
							timeLength: doc.data().timeLength,
							due: doc.data().due.toDate(),
						});
					});
					newTodoList = newTodoList
						.sort(function (a, b) {
							return new Date(b.due) - new Date(a.due);
						})
						.reverse();
					newDoneList = newDoneList
						.sort(function (a, b) {
							return new Date(b.due) - new Date(a.due);
						})
						.reverse();
					todoList = newTodoList;
					doneList = newDoneList;
				}
		  )
		: function () {};
</script>

{#if $user === null}
	<SignIn />
{:else}
	<p>Welcome {$user.displayName}</p>
	<form on:submit|preventDefault={added}>
		<input
			type="text"
			name="description"
			placeholder="let what must be..."
			required
		/>
		<input
			class="number"
			type="number"
			min="0"
			name="hours"
			placeholder="hours"
		/>
		<input
			class="number"
			type="number"
			min="0"
			name="minutes"
			placeholder="minutes"
		/>
		<div style="padding-bottom: 0.5em;">
			<DateInput
				min={new Date()}
				bind:value={dateInput}
				closeOnSelection="true"
				format="yyyy-MM-dd"
			/>
		</div>
		<input type="submit" value="Add" />
	</form>

	{#if error.length > 0}
		<p class="errortext">
			{error}
		</p>
	{/if}

	<br />
	{#each todoList as item}
		<span>
			{item.text} | {getHours(item.timeLength) > 0
				? getHours(item.timeLength) + " hours"
				: ""}
			{getMinutes(item.timeLength) > 0
				? getMinutes(item.timeLength) + " minutes"
				: ""} | {fmtDate(item.due)}</span
		>
		<span class="clickable" on:click={() => setIdStatus(item.id, true)}
			>🗑️</span
		>
		<br />
	{/each}
	<hr />
	<p>finished</p>
	{#each doneList as item}
		<span>
			{item.text} | {getHours(item.timeLength) > 0
				? getHours(item.timeLength) + " hours"
				: ""}
			{getMinutes(item.timeLength) > 0
				? getMinutes(item.timeLength) + " minutes"
				: ""} | {fmtDate(item.due)}</span
		>
		<span class="clickable" on:click={() => setIdStatus(item.id, false)}
			>♻️</span
		>
		<br />
	{/each}
	<style>
		.clickable {
			cursor: pointer;
		}
		.number {
			width: 6em;
		}
		input:invalid {
			border: 2px solid pink;
			outline: none;
		}
		.checked {
			text-decoration: line-through;
		}
	</style>
{/if}
