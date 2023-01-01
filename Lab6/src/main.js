const id = id => document.getElementById(id);
const create = type => document.createElement(type);

let players = [];
let startingPlayer = 0;
let currentPlayer = 0;
let humanFinished = null;
let pile = 0;
let difficulty = 0;
let round = 0;

id("ai0").addEventListener("click", selectDifficulty);
id("ai1").addEventListener("click", selectDifficulty);
id("ai2").addEventListener("click", selectDifficulty);
id("ai3").addEventListener("click", selectDifficulty);
id("ai4").addEventListener("click", selectDifficulty);
id("throw").addEventListener("click", async () => {
	await throwCube();
	if(players[currentPlayer].numberSum > 21) {
		humanFinished();
	}
});
id("next").addEventListener("click", () => {
	humanFinished();
});

function selectDifficulty(evt) {
	difficulty = [0.1,0.3,0.5,0.7,0.9][+evt.target.id[2]];

	players = [];
	players.push(new HumanPlayer());
	players.push(new AIPlayer());
	render();
	
	id("aiSelect").classList.add("hidden");
	id("game").classList.remove("hidden");
	
	play();
}

async function play() {
	startingPlayer = 0;
	round = 1;
	while(players.length > 1) {
		await playOneRound();
		await wait(2);
		startingPlayer = (startingPlayer+1) % players.length;
		round++;
		render();
	}
	alert(players[0].isAI ? "Комп'ютер переміг" : "Ви перемогли");
}

async function playOneRound() {
	
	// Забрати по одній фішці у купу
	for(let i=0; i<players.length; i++) {
		players[i].numberSum = 0;
		players[i].chipCount--;
		pile++;
	}
	
	// Дати кожному гравцю покидати кість
	currentPlayer = startingPlayer;
	render();
	let maxPlayers = [];
	let maxScore = 0;
	for(let i=0; i<players.length; i++) {
		let player = players[currentPlayer];
		
		await player.doTurns(maxScore, i);
		
		if(player.numberSum > maxScore && player.numberSum < 22) {
			maxScore = player.numberSum;
			maxPlayers = [];
		}
		if(player.numberSum == maxScore) {
			maxPlayers.push(player);
		}
		await wait(1);
		currentPlayer = (currentPlayer+1) % players.length;
		render();
	}
	
	// Видати фішки переможцям
	if(maxPlayers.length > 0) {
		while(pile >= maxPlayers.length) {
			for(let i=0; i<maxPlayers.length; i++) {
				maxPlayers[i].chipCount++;
				pile--;
			}
			render();
			await wait(0.5);
		}
	}
	
	// Видалити гравців без фішок
	for(let i=0; i<players.length; i++) {
		if(players[i].chipCount == 0) {
			players.splice(i, 1);
			i--;
		}
	}
	
	render();
}


class Player {
	isAI;
	numberSum = 0;
	chipCount = 5;
}

class HumanPlayer extends Player {
	constructor() {
		super();
		this.isAI = false;
	}
	async doTurns() {
		id("throw").disabled = false;
		id("next").disabled = false;
		console.log("Human Turn")
		
		await new Promise(resolve => humanFinished = resolve); //when function given in resolve is called, it makes await continue
		
		id("throw").disabled = true;
		id("next").disabled = true;
		console.log("Human Turn End", players[currentPlayer].numberSum);
	}
}

class AIPlayer extends Player {
	constructor() {
		super();
		this.isAI = true;
	}
	async doTurns(maxScoreSoFar, playerId) {
		const playersAfterMe = players.length - (playerId+1);
		const me = players[currentPlayer];
		console.log("AI Turn")
		while(me.numberSum < 16) {
			await throwCube();
			await wait(0.5);
		}
		
		const ifIGetThisMyChanceIs = {};
		for(let number=16; number<22; number++) {
			let total = 0;
			for(let i=16; i<22; i++) {
				total += chanceToWinIfOtherThorws(number, i).chance;
			}
			ifIGetThisMyChanceIs[number] = total / 6;
		}
		
		let chanceIfIContinue = chanceToWinIfIThorwAgain(maxScoreSoFar, players[currentPlayer].numberSum, playersAfterMe, ifIGetThisMyChanceIs);
		let chanceIfIFinish;
		if(playersAfterMe > 0) {
			chanceIfIFinish = ifIGetThisMyChanceIs[players[currentPlayer].numberSum];
		} else {
			chanceIfIFinish = players[currentPlayer].numberSum >= maxScoreSoFar ? 1 : 0;
		}
		console.log("При ",players[currentPlayer].numberSum,"якщо кинути, шанс", chanceIfIContinue);
		console.log("При ",players[currentPlayer].numberSum,"якщо не кинути, шанс", chanceIfIFinish);
		while(chanceIfIContinue > difficulty || (chanceIfIContinue > 0 && chanceIfIFinish == 0)) {
			await throwCube();
			await wait(0.5);
			chanceIfIContinue = chanceToWinIfIThorwAgain(maxScoreSoFar, players[currentPlayer].numberSum, playersAfterMe, ifIGetThisMyChanceIs);
			if(playersAfterMe > 0) {
				chanceIfIFinish = ifIGetThisMyChanceIs[players[currentPlayer].numberSum];
			} else {
				chanceIfIFinish = players[currentPlayer].numberSum >= maxScoreSoFar ? 1 : 0;
			}
			console.log("При ",players[currentPlayer].numberSum,"якщо кинути, шанс", chanceIfIContinue);
			console.log("При ",players[currentPlayer].numberSum,"якщо не кинути, шанс", chanceIfIFinish);
		}
		console.log("AI Turn End", players[currentPlayer].numberSum);
	}
}


function chanceToWinIfIThorwAgain(maxScoreSoFar, myScore, playerAfterMe, ifIGetThisMyChanceIs, depth="", history=null) {
	if(!history) history=myScore;
	let total = 0;
	for(let number=1; number<7; number++) {
		let chance = 0;
		if(myScore + number > 21) {
			chance = 0;
		} else {
			let chanceIfIContinue = chanceToWinIfIThorwAgain(maxScoreSoFar, myScore + number, playerAfterMe, ifIGetThisMyChanceIs, depth+" ", history+"+"+number);
			let chanceIfIFinish;
			if(playerAfterMe > 0) {
				chanceIfIFinish = ifIGetThisMyChanceIs[myScore + number];
			} else {
				chanceIfIFinish = (myScore + number) >= maxScoreSoFar ? 1 : 0;
			}
			chance = Math.max(chanceIfIContinue, chanceIfIFinish);
		}
		total += chance;
	}
	return total / 6;
}

function chanceToWinIfOtherThorws(thinkerScore, myScore) {
	let total = 0;
	for(let number=1; number<7; number++) {
		let chance = 0;
		if(myScore + number > 21) { 
			chance = 1; // Цей програв, перший виграв
		} else {
			chance += chanceToWinIfOtherThorws(thinkerScore, myScore + number).chance;
		}
		total += chance;
	}
	let chanceIfIContinue = total / 6;
	let chanceIfIFinish;
	if(myScore > thinkerScore) {
		chanceIfIFinish = 0; // Набрав достатньо щоб перший програв
	} else {
		chanceIfIFinish = 1; // Не набрав достатньо щоб перший програв
	}
	chance = Math.min(chanceIfIContinue, chanceIfIFinish);
	return {chance, chanceIfIContinue, chanceIfIFinish};
}

function render() {
	const table = id("table");
	const tbody = table.children[0];
	const elements = tbody.children;
	while(elements.length > 1) {
		elements[1].remove();
	}
	let aiId = 1;
	for(let i=0; i<players.length; i++) {
		const player = players[i];

		const name = create("td");
		name.innerText = (currentPlayer == i ? "> ":"") + (player.isAI ? "Комп'ютер "+(aiId++) : "Ви");

		const sum = create("td");
		sum.innerText = player.numberSum;
		if(player.numberSum > 21) sum.classList.add("red");

		const chips = create("td");
		chips.innerText = player.chipCount;
		if(player.chipCount < 1) chips.classList.add("red");

		const tr = create("tr");
		tr.append(name, sum, chips);
		tbody.append(tr);
	}
	id("pile").innerText = "Купа: "+pile+" Раунд: "+round;
}

async function wait(time) {
	return new Promise(resolve => setTimeout(resolve, time*1000));
}

// Ця фунція перевизначається
async function throwCube() {
	players[currentPlayer].numberSum += 1+Math.floor(Math.random()*6);
	render();
}
