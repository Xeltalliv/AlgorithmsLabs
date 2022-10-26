const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");
const queen = new Image(); queen.src = "../queen.png";

let states = [];
let finalState = null;
let queenCount = 8;
let fieldSize = 8;

document.getElementById("start").addEventListener("click", async function() {
	document.getElementById("info").innerText = "";

	queenCount = Math.max(document.getElementById("queen").value | 0, 2);
	fieldSize = Math.max(document.getElementById("board").value | 0, 2);
	canvas.width = canvas.height = 44 + fieldSize * 32;

	addRandomly();
	let queensInitial = states[0].queens;
	draw(queensInitial);
	await wait(0.5);
	document.getElementById("info").innerText = "Пошук шляху...";
	let startTime = Date.now();

	await solve();

	document.getElementById("info").innerText = "Шлях знайдено за "+((Date.now() - startTime) / 1000)+" секунд";
	states = [];
	let action = finalState.whatIDid;
	let log = [];
	while(action) {
		log.unshift([action[1], action[2], action[3]]);
		action = action[4];
	}
	await playAnimation(queensInitial, log);
});

class State {
	depth = 0;
	hitfield = [];
	actions = [];
	queens = [];
	whatIDid = null;
	isSolution() {
		let hitfield = this.hitfield;
		for(let q=0; q<queenCount; q++) {
			let x = this.queens[q][0];
			let y = this.queens[q][1];
			if(hitfield[y*8+x] > 1) return false;
		}
		return true;
	}
	genActions() {
		let actions = [];
		let hitfield = this.hitfield;
		for(let q=0; q<queenCount; q++) {
			let x = this.queens[q][0];
			let y = this.queens[q][1];
			for(let i=0; i<fieldSize; i++) {
				if(x !== i) actions.push([hitfield[y*8+i], q, i, y]);
			}
			for(let i=0; i<fieldSize; i++) {
				if(y !== i) actions.push([hitfield[i*8+x], q, x, i]);
			}
			let z = y-x;
			for(let i=0; i<fieldSize; i++) {
				if(x !== i && z+i >= 0 && z+i < fieldSize) actions.push([hitfield[(z+i)*8+i], q, i, z+i]);
			}
			z = y+x;
			for(let i=0; i<fieldSize; i++) {
				if(x !== i && z-i >= 0 && z-i < fieldSize) actions.push([hitfield[(z-i)*8+i], q, i, z-i]);
			}
		}
		actions.sort((a,b) => a[0]-b[0]);
		this.actions = actions;
	}
	makeChild(myIndex) {
		let action = this.actions.shift();
		let newState = new State();
		newState.depth = this.depth + 1;
		newState.whatIDid = action;
		action.push(this.whatIDid);
		newState.queens = copy(this.queens);
		newState.hitfield = this.hitfield.slice();
		addHitfield(newState.hitfield, newState.queens[action[1]][0], newState.queens[action[1]][1], -1);
		newState.queens[action[1]][0] = action[2];
		newState.queens[action[1]][1] = action[3];
		addHitfield(newState.hitfield, action[2], action[3], 1);
		if(newState.isSolution()) {
			console.log(newState);
			finalState = newState;
			return true;
		}
		newState.genActions();
		states.push(newState);
		if(this.actions.length === 0) states.splice(myIndex, 1);
	}
}

async function solve() {
	let delay = 0;
	while(true) {
		let minIdx = null;
		let minVal = Infinity;
		for(let i=0; i<states.length; i++) {
			let state = states[i];
			let val = state.depth + state.actions[0][0];
			if(val < minVal) {
				minVal = val;
				minIdx = i;
			}
		}
		if(states[minIdx].makeChild(minIdx)) return true;
		if(++delay > 1000) {
			delay = 0;
			await wait(0.001);
		}
	}
}


function draw(queens) {
	queens = queens.slice().sort((a,b) => a[1]-b[1]);
	ctx.clearRect(0, 0, 300, 300);

	ctx.fillStyle = "black";
	ctx.fillRect(20, 20, fieldSize*32+4, fieldSize*32+4);
	ctx.font = "20px sans-serif";

	const colors = ["white", "black"];
	for(let y=0; y<fieldSize; y++) {
		for(let x=0; x<fieldSize; x++) {
			ctx.fillStyle = colors[(x+y) % 2];
			ctx.fillRect(22+x*32, 22+y*32, 32, 32);
		}
	}
	for(let q=0; q<queenCount; q++) {
		let x = queens[q][0];
		let y = queens[q][1];
		ctx.drawImage(queen, 22+x*32, 22+y*32);
	}
	ctx.fillStyle = "black";
	let fs32 = fieldSize*32;
	for(let y=0; y<fieldSize; y++) {
		ctx.fillText("12345678"[y], 4, 12+fs32-y*32);
		ctx.fillText("12345678"[y], 31+fs32, 12+fs32-y*32);
		ctx.fillText("ABCDEFGH"[y], 33+y*32, 14);
		ctx.fillText("ABCDEFGH"[y], 33+y*32, 44+fs32);
	}
}

function addRandomly() {
	let newState = new State();
	let queens = newState.queens;
	let hitfield = newState.hitfield = new Array(8*8).fill(0);
	let add = queenCount;
	while(add > 0) {
		let x = random(0, fieldSize-1);
		let y = random(0, fieldSize-1);
		let skip = false;
		for(let q=0; q<queens.length; q++) {
			if(queens[q][0] === x && queens[q][1] === y) skip = true;
		}
		if(skip) continue;

		addHitfield(hitfield, x, y, 1);
		queens.push([x, y]);
		add--;
	}
	draw(queens);
	newState.genActions();
	states.push(newState);
}

function addHitfield(hitfield, x, y, val) {
	hitfield[y*8+x] += val;
	for(let i=0; i<fieldSize; i++) {
		if(x !== i) hitfield[y*8+i] += val;
	}
	for(let i=0; i<fieldSize; i++) {
		if(y !== i) hitfield[i*8+x] += val;
	}
	let z = y-x;
	for(let i=0; i<fieldSize; i++) {
		if(x !== i && z+i >= 0 && z+i < fieldSize) hitfield[(z+i)*8+i] += val;
	}
	z = y+x;
	for(let i=0; i<fieldSize; i++) {
		if(x !== i && z-i >= 0 && z-i < fieldSize) hitfield[(z-i)*8+i] += val;
	}
}

function random(a, b) {
	return a + Math.floor(Math.random() * (b-a+1));
}

function copy(arr) {
	return arr.map(e => e.slice());
}

async function wait(seconds) {
	return new Promise((resolve, reject) => setTimeout(resolve, seconds * 1000));
}
async function waitFrame() {
	return new Promise((resolve, reject) => requestAnimationFrame(resolve));
}

async function playAnimation(queens, log) {
	console.log("animation");
	for(let step=0; step<log.length; step++) {
		let q = log[step][0];
		let oldx = queens[q][0];
		let oldy = queens[q][1];
		let newx = log[step][1];
		let newy = log[step][2];
		for(let t=0; t<=1; t+=0.01) {
			let t2 = t * t * (1.5 - t) * 2;
			queens[q][0] = oldx + (newx - oldx) * t2;
			queens[q][1] = oldy + (newy - oldy) * t2 - t * (1-t);
			draw(queens);
			await waitFrame();
		}
	}
}