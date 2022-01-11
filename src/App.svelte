<script>
	import { initializeApp } from "firebase/app";
	import SignIn from "./SignIn.svelte";

	const firebaseConfig = {
		apiKey: "AIzaSyDELqLj_TdQaSS46V7GoABf9Jf80qg5Qu0",
		authDomain: "medoyoudo-3998f.firebaseapp.com",
		projectId: "medoyoudo-3998f",
		storageBucket: "medoyoudo-3998f.appspot.com",
		messagingSenderId: "850619333270",
		appId: "1:850619333270:web:3f9f2e8a940c7549d1a0b7",
	};
	const app = initializeApp(firebaseConfig);
	let user = null;

	import { DateInput } from "date-picker-svelte";
	function fromNow(days) {
		let toReturn = new Date();
		toReturn.setDate(new Date().getDate() + days);
		return toReturn;
	}

	let todoList = [
		{
			text: "Write my first post",
			status: true,
			timeLength: 60,
			due: fromNow(1),
		},
		{
			text: "Upload the post to the blog",
			status: false,
			timeLength: 75,
			due: fromNow(2),
		},
		{
			text: "Publish the post at Facebook",
			status: false,
			timeLength: 125,
			due: fromNow(3),
		},
	];

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
		todoList = [
			...todoList,
			{
				text: desc,
				status: false,
				timeLength: totalMinutes,
				due: dateInput,
			},
		];
		error = "";
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

	function removeFromList(index) {
		todoList.splice(index, 1);
		todoList = todoList;
	}
</script>

{#if user === null}
	<SignIn onUser={(u) => (user = u)} />
{:else}
	<p>Welcome {user.displayName}</p>
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
	{#each todoList as item, index}
		<input bind:checked={item.status} type="checkbox" />
		<span class:checked={item.status}
			>{item.text} | {getHours(item.timeLength) > 0
				? getHours(item.timeLength) + " hours"
				: ""}
			{getMinutes(item.timeLength) > 0
				? getMinutes(item.timeLength) + " minutes"
				: ""} | {fmtDate(item.due)}</span
		>
		<span id="x" on:click={() => removeFromList(index)}>L</span>
		<br />
	{/each}
	<hr />
	<p>finished</p>

	<style>
		#x {
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
