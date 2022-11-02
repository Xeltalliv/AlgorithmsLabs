const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");
const queen = new Image(); queen.src = "../queen.png";

let queens2 = [];
let playfield = new Array(8).fill(0).map(array => new Array(8).fill(0));
let log = [];

let maxDepth = 32;
let totalWrong = 0;
let queenCount = 8;
let fieldSize = 8;
let delay = 0;
let solved = false;

document.getElementById("start").addEventListener("click", async function() {
	document.getElementById("info").innerText = "";

	queenCount = Math.max(document.getElementById("queen").value | 0, 2);
	fieldSize = Math.max(document.getElementById("board").value | 0, 2);
	maxDepth = Math.max(document.getElementById("depth").value | 0, 1);
	delay = Math.max(document.getElementById("delay").value, 0);
	canvas.width = canvas.height = 44 + fieldSize * 32;

	queens2 = [];
	playfield = new Array(8).fill(0).map(array => new Array(8).fill(0));
	log = [];
	solved = false;

	addRandomly();
	draw(queens2);
	await wait(0.5);

	document.getElementById("info").innerText = "Пошук шляху...";
	await waitFrame();
	let startTime = Date.now();

	let queens = copy(queens2);
	for(let q=0; q<queenCount; q++) {
		let x = queens[q][0];
		let y = queens[q][1];
		for(let i=0; i<fieldSize; i++) {
			if(y !== i) await move(queens, q, x, i, 0, 2);
		}
	}
	if(solved) {
		document.getElementById("info").innerText = "Шлях знайдено за "+((Date.now() - startTime) / 1000)+" секунд";
		await playAnimation();
	} else {
		document.getElementById("info").innerText = "Шлях не знайдено";
	}
});

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
		if(delay > 0) {
			let l = ctx.measureText(queens[q][2]).width/2;
			ctx.fillStyle = "#000000";
			ctx.fillText(queens[q][2], 38-l+x*32, 46+y*32);
			ctx.fillStyle = "#ff0000";
			ctx.fillText(queens[q][2], 38-l+x*32, 44+y*32);
		}
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
	let add = queenCount;
	while(add > 0) {
		let x = queenCount - add;
		let y = random(0, fieldSize-1);
		playfield[y][x] = 1;

		let wrong = 0;
		for(let i=0; i<queens2.length; i++) {
			let x2 = queens2[i][0];
			let y2 = queens2[i][1];
			if(x === x2 || y === y2 || x+y === x2+y2 || x-y === x2-y2) {
				queens2[i][2]++;
				wrong++;
				totalWrong++;
			}
		}
		totalWrong += wrong+1;
		queens2.push([x, y, wrong+1]);
		add--;
	}
}

function random(a, b) {
	return a + Math.floor(Math.random() * (b-a+1));
}

async function move(queens, queen, x, y, depth, last) {
	if(depth >= maxDepth || solved) return;

	if(playfield[y][x] === 1) return;
	let oldx = queens[queen][0];
	let oldy = queens[queen][1];
	let oldw = queens[queen][2];
	log.push([queen, x, y]);
	queens[queen][0] = x;
	queens[queen][1] = y;
	playfield[y][x] = 1;
	playfield[oldy][oldx] = 0;

	totalWrong -= oldw;
	let wrong = 0;
	for(let i=0; i<queenCount; i++) {
		if(i == queen) continue;
		let x2 = queens[i][0];
		let y2 = queens[i][1];
		if(oldx === x2 || oldy === y2 || oldx+oldy === x2+y2 || oldx-oldy === x2-y2) {
			queens[i][2]--;
			totalWrong--;
		}
		if(x === x2 || y === y2 || x+y === x2+y2 || x-y === x2-y2) {
			queens[i][2]++;
			wrong++;
			totalWrong++;
		}
	}
	queens[queen][2] = wrong+1;
	totalWrong += wrong+1;
	if(totalWrong == queenCount) {
		solved = true;
		return;
	}

	if(delay > 0) {
		draw(queens);
		await wait(delay);
	}

	depth++;
	for(let q=0; q<queenCount; q++) {
		let x = queens[q][0];
		let y = queens[q][1];
		if(q !== queen || last !== 2) {
			for(let i=0; i<fieldSize; i++) {
				if(y !== i) await move(queens, q, x, i, depth, 2);
			}
		}
	}
	if(solved) return;
	queens[queen][0] = oldx;
	queens[queen][1] = oldy;
	queens[queen][2] = oldw;
	playfield[y][x] = 0;
	playfield[oldy][oldx] = 1;
	totalWrong -= wrong+1;
	totalWrong += oldw;
	for(let i=0; i<queenCount; i++) {
		if(i == queen) continue;
		let x2 = queens[i][0];
		let y2 = queens[i][1];
		if(oldx === x2 || oldy === y2 || oldx+oldy === x2+y2 || oldx-oldy === x2-y2) {
			queens[i][2]++;
			totalWrong++;
		}
		if(x === x2 || y === y2 || x+y === x2+y2 || x-y === x2-y2) {
			queens[i][2]--;
			totalWrong--;
		}
	}
	log.pop();
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

async function playAnimation() {
	console.log("animation");
	for(let step=0; step<log.length; step++) {
		let q = log[step][0];
		let oldx = queens2[q][0];
		let oldy = queens2[q][1];
		let newx = log[step][1];
		let newy = log[step][2];
		for(let t=0; t<=1; t+=0.01) {
			let t2 = t * t * (1.5 - t) * 2;
			queens2[q][0] = oldx + (newx - oldx) * t2;
			queens2[q][1] = oldy + (newy - oldy) * t2 - t * (1-t);
			draw(queens2);
			await waitFrame();
		}
	}
}