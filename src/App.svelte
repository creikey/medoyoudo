<script>
	import {
		addDoc,
		deleteDoc,
		collection,
		connectFirestoreEmulator,
		doc,
		getFirestore,
		onSnapshot,
		query,
		updateDoc,
		setDoc,
	} from "firebase/firestore";
	import SignIn from "./SignIn.svelte";
	import { user } from "./stores";
	import { DateInput } from "date-picker-svelte";
	import { onDestroy } from "svelte";
	import { Howl } from 'howler';
	import Toggle from "svelte-toggle";

	const db = getFirestore();
	if (location.hostname === "localhost") {
		connectFirestoreEmulator(db, "localhost", 8080);
	}

	// audio
	let audios = {};
	function loadAudio() {
		// force html5 so no CORS errors
		audios = {
			trashed: new Howl({src: ["https://wiki.teamfortress.com/w/images/5/5c/Vote_yes.wav"], html5: true}),
			working: new Howl({src: ["https://wiki.teamfortress.com/w/images/e/ef/Vote_started.wav"], html5: true}),
			not_working: new Howl({src: ["https://wiki.teamfortress.com/w/images/b/b2/Vote_no.wav"], html5: true}),
			new_task: new Howl({src: ["https://wiki.teamfortress.com/w/images/c/cf/Vote_success.wav"], html5: true}),
			recycle_task: new Howl({src: ["https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav"], html5: true}),
			delete_task: new Howl({src: ["https://wiki.teamfortress.com/w/images/6/6c/Trade_changed.wav"], html5: true}),
		}
	}
	let not_muted = false;
	function playAudio(audio) {
		if(not_muted) {
			audio.play();
		}
	}

	// utility functions
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

	function getHours(t) {
		if(t > 0) {
			return Math.floor(t / 60).toFixed();
		} else {
			return -Math.floor(-t / 60).toFixed();
		}
	}

	function getMinutes(t) {
		return t % 60;
	}

	// https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
	function formatAMPM(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}

	function fmtDuration(duration) {
		let toReturn = "";
		if (Math.abs(getHours(duration)) > 0) {
			toReturn += getHours(duration) + " hours";
		}
		if (Math.abs(getMinutes(duration)) > 0) {
			toReturn += " " + (duration % 60) + " minutes";
		}
		if(toReturn === "") {
			toReturn = "0 minutes";
		}
		return toReturn;
	}

	function timeDiffToDays(timeDiff) {
		return timeDiff / (1000 * 3600 * 24);
	}

	function getTimeLeftToday(start, due, workedOnFor, totalWork) {
		var days = timeDiffToDays(due.getTime() - start.getTime());
		var daysSinceStarting = timeDiffToDays((new Date()).getTime() - start.getTime())
		var daysLeft = timeDiffToDays(due.getTime() - (new Date()).getTime());
		let shouldveDoneAlready = Math.max(0.0, (daysSinceStarting - 1))*(totalWork/days);
		if(workedOnFor < shouldveDoneAlready) {
			return Math.floor((shouldveDoneAlready - workedOnFor) + (totalWork/daysLeft)).toFixed();
		} else {
			console.log(shouldveDoneAlready);
			return Math.floor((totalWork/daysLeft) - (workedOnFor - shouldveDoneAlready)).toFixed();
		}
	}

	let todoList = [];
	let doneList = [];
	let error = "";
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
		if (totalMinutes <= 0) {
			error = "Without time, there is no change";
			return;
		}
		addDoc(collection(db, "users/" + $user.uid + "/tasks"), {
			text: desc,
			status: false,
			timeLength: totalMinutes,
			due: dateInput,
			workedOnFor: 0,
			startDate: new Date(),
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
		playAudio(audios.new_task);
		// 		event.srcElement.reset(); can't use this fucks up the date input
	}

	function setIdStatus(id, newStatus) {
		if(id === userData.workingOn) {
			setWorkingOn(id);
		}
		if(newStatus === true) {
			playAudio(audios.trashed)
		} else {
			playAudio(audios.recycle_task)
		}
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

	function deleteTask(id) {
		playAudio(audios.delete_task);
		deleteDoc(doc(db, "users/" + $user.uid + "/tasks/" + id)).then(() => {
				error = "";
			})
			.catch((e) => {
				error = "" + e;
			});
	}

	let workInterval = null;
	let workIntervalTarget = null;
	function setWorkingOn(id) {
		let newWorkingOn = id === userData.workingOn ? "" : id;
		let audio = null;
		if(workInterval !== null) {
			clearInterval(workInterval);
			workInterval = null;
		}
		if(newWorkingOn !== "") {
			playAudio(audios.working);
			workInterval = setInterval(() => {
				updateDoc(doc(db, "users" + "/" + $user.uid + "/tasks/" + id), {
					workedOnFor: getCachedTaskFromID(id, todoList).workedOnFor + 1,
				})
			}, 1000 * 60);
			workIntervalTarget = id;
		} else {
			playAudio(audios.not_working);
		}
		setDoc(doc(db, "users" + "/" + $user.uid), {
			workingOn: newWorkingOn,
			workingSince: new Date(),
		}, { merge: true })
	}

	let userUnsubs = []; // all called when component being destroyed or user logging out
	let userData = {
		workingOn: "",
		workingSince: new Date(),
	};

	$: curWorkingTask = getCachedTaskFromID(userData.workingOn, todoList)

	function getCachedTaskFromID(id, todoList) {
		if(id === "") {
			return null;
		}
		for(let i = 0; i < todoList.length; i++) {
			if(todoList[i].id === id) {
				return todoList[i];
			}
		}
		console.error("Could not find working on id " + id);
		return null;
	}
	
	function beforeUnload() {
		if(workInterval !== null) {
			event.preventDefault();
			event.returnValue = '';
			return '';
		}
	}

	const unsubscribe = user.subscribe((value) => {
		for (let i = 0; i < userUnsubs.length; i++) {
			userUnsubs[i]();
		}
		userUnsubs = [];

		if ($user === null) {
			return;
		}
		userUnsubs.push(
			onSnapshot(doc(db, "users", $user.uid), (userDoc) => {
				if(userDoc !== undefined && userDoc.data() !== undefined) {
					userData["workingOn"] = userDoc.data().workingOn;
					userData["workingSince"] = userDoc.data().workingSince.toDate();
				} else {
					userData["workingOn"] = "";
					userData["workingSince"] = new Date();
				}
				if(workInterval !== null && (userData.workingOn === "" || userData.workingOn !== workIntervalTarget)) {
					clearInterval(workInterval);
					workInterval = null;
				}
				userData = userData;
			})
		);
		userUnsubs.push(
			onSnapshot(
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
							workedOnFor: doc.data().workedOnFor
								? doc.data().workedOnFor
								: 0,
							startDate: doc.data().startDate
								? doc.data().startDate.toDate()
								: new Date(),
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
							return new Date(b.startDate) - new Date(a.startDate);
						})
						.reverse();
					todoList = newTodoList;
					doneList = newDoneList;
				}
			)
		);
	});

	onDestroy(() => {
		for (let i = 0; i < userUnsubs.length; i++) {
			userUnsubs[i]();
		}
	});
</script>

<svelte:window on:beforeunload={beforeUnload}/>

<Toggle on:toggle={loadAudio} label="Team Fortress 2 Sound Effects" bind:toggled={not_muted}/>

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

	{#if curWorkingTask !== null}
	<p>Working on {curWorkingTask.text} since {formatAMPM(userData.workingSince)}</p>
	{:else}
	<p>Press the briefcase to work on something</p>
	{/if}

	<br />
	{#each todoList as item}
	<div class={item.id===userData.workingOn ? "wrkingon": ""}>
		<span class="clickable" on:click={() => setIdStatus(item.id, true)}
			>🗑️</span
		>
		<span>
			{item.text} | {fmtDuration(getTimeLeftToday(item.startDate, item.due, item.workedOnFor, item.timeLength))} left today | {fmtDuration(item.timeLength - item.workedOnFor)} remaining | {fmtDuration(item.timeLength)} total | Started {fmtDate(item.startDate)} due {fmtDate(
				item.due
			)}</span
		>
		<span class="clickable" on:click={() => setWorkingOn(item.id)}>💼</span>
		<br />
	</div>
	{/each}
	<hr />
	<p>finished</p>
	{#each doneList as item}
		<span class="clickable" on:click={() => setIdStatus(item.id, false)}
			>♻️</span
		>
		<span class="clickable" on:click={() => deleteTask(item.id)}
			>🗑️</span
		>
		<span>
			{item.text} | {fmtDuration(item.timeLength)} | {fmtDate(
				item.due
			)}</span
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
		.wrkingon {
			padding-top: 1em;
			padding-bottom: 1em;
			background-color: lightgreen;
		}
	</style>
{/if}
