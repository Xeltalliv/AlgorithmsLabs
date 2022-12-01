"use strict";
let id = id => document.getElementById(id);
let randomInt = upTo => Math.floor(Math.random() * upTo);

let canvas = id("canvas");
let ctx = canvas.getContext("2d");
let size = canvas.width = canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
	if(size == window.innerHeight) return;
	size = canvas.width = canvas.height = window.innerHeight
	draw();
});

let points = [];
let distanceMatrix = [];
let feramoneMatrix = [];
let Lmin = 0;
let alpha = 3;
let beta = 2;
let ro = 0.3;
let vertexCount = 200;
let antCount = 45;
let int1, int2;
let iterations = 0;
let output = "";

function init() {
	alpha = +id("alpha").value;
	beta = +id("beta").value;
	ro = +id("ro").value;
	vertexCount = +id("vertexCount").value;
	antCount = +id("antCount").value;

	points = [];
	distanceMatrix = [];
	feramoneMatrix = [];
	output = "";

	for(let i=0; i<vertexCount; i++) {
		let maxDist = 0;
		let maxPos;
		for(let j=0; j<20; j++) {
			let pos = [Math.random()*35+0.5, Math.random()*35+0.5, 0]
			let minDist = Infinity;
			for(let k=0; k<points.length; k++) {
				let dx = pos[0]-points[k][0];
				let dy = pos[1]-points[k][1];
				let curDist = dx*dx + dy*dy
				if(curDist < minDist) {
					minDist = curDist;
				}
			}
			if(minDist > maxDist) {
				maxDist = minDist;
				maxPos = pos;
			}
		}
		points.push(maxPos);
	}
	
	for(let i=0; i<vertexCount; i++) {
		let distanceMatrixRow = [];
		let feramoneMatrixRow = [];
		for(let j=0; j<vertexCount; j++) {
			let dx = points[i][0]-points[j][0];
			let dy = points[i][1]-points[j][1];
			let dist = Math.sqrt(dx*dx + dy*dy);
			distanceMatrixRow.push(dist);
			feramoneMatrixRow.push(0.1);
		}
		distanceMatrix.push(distanceMatrixRow);
		feramoneMatrix.push(feramoneMatrixRow);
	}

	Lmin = 0;
	let now = 0;
	for(let i=0; i<vertexCount-1; i++) {
		let minDist = Infinity;
		let minIdx = 0;
		for(let j=1; j<vertexCount; j++) {
			if(points[j][2] == 0) {
				let dx = points[now][0]-points[j][0];
				let dy = points[now][1]-points[j][1];
				let dist = dx*dx + dy*dy;
				if(dist < minDist) {
					minDist = dist;
					minIdx = j;
				}
			}
		}
		Lmin += Math.sqrt(minDist);
		//feramoneMatrix[now][minIdx] = 4;
		//feramoneMatrix[minIdx][now] = 4;
		now = minIdx;
		points[now][2] = Lmin;
	}
	//feramoneMatrix[now][0] = 4;
	//feramoneMatrix[0][now] = 4;
	id("Lmin").value = Lmin;
}

function draw() {
	ctx.save();
	ctx.scale(size / 256, size / 256);
	ctx.clearRect(0, 0, 256, 256);
	let scaler = 256 / 36;

	for(let i=0; i<vertexCount; i++) {
		for(let j=i+1; j<vertexCount; j++) {
			let dx = points[i][0]-points[j][0];
			let dy = points[i][1]-points[j][1];
			if(feramoneMatrix[i][j] > 0.01) {
				ctx.globalAlpha = Math.atan(feramoneMatrix[i][j]) / Math.PI * 2;
				ctx.beginPath();
				ctx.moveTo(points[i][0] * scaler, points[i][1] * scaler);
				ctx.lineTo(points[j][0] * scaler, points[j][1] * scaler);
				ctx.closePath();
				ctx.stroke();
			}
		}
	}
	ctx.fillStyle = "red";
	ctx.globalAlpha = 1;
	ctx.beginPath();
	for(let i=0; i<vertexCount; i++) {
		ctx.moveTo(points[i][0] * scaler + 3, points[i][1] * scaler);
		ctx.arc(points[i][0] * scaler, points[i][1] * scaler, 3, 0, Math.PI*2);
	}
	ctx.closePath();
	ctx.fill();

	ctx.restore();
}

function step() {
	let feramoneAddMatrix = [];
	for(let i=0; i<vertexCount; i++) {
		let row = [];
		for(let j=0; j<vertexCount; j++) {
			row.push(0);
		}
		feramoneAddMatrix.push(row);
	}

	for(let i=0; i<antCount; i++) {
		let walked = 0;
		let startPos = randomInt(vertexCount);
		let curPos = startPos;
		let visited = new Array(vertexCount).fill(false);
		visited[curPos] = true;

		for(let k=1; k<=vertexCount; k++) {
			let newPos = 0;
			if(k < vertexCount) {
				let chances = [];
				let chanceSum = 0;
				for(let j=0; j<vertexCount; j++) {
					if(visited[j]) {
						chances.push(0);
					} else {
						let chance = (feramoneMatrix[curPos][j] ** alpha) * ((1 / distanceMatrix[curPos][j]) ** beta);
						chanceSum += chance;
						chances.push(chance);
					}
				}
				let chanceRanges = [];
				for(let j=0; j<vertexCount; j++) {
					chances[j] /= chanceSum;
					if(j == 0) {
						chanceRanges.push(0);
					} else {
						chanceRanges.push(chanceRanges[j-1] + chances[j-1]);
					}
				}
				
				let random = Math.random();
				while(random > chanceRanges[newPos]) {
					newPos++;
				}
				newPos--;
			} else {
				newPos = startPos;
			}

			walked += distanceMatrix[curPos][newPos];
			let add = Lmin / walked;
			feramoneAddMatrix[curPos][newPos] += add;
			feramoneAddMatrix[newPos][curPos] += add;
			visited[newPos] = true;
			curPos = newPos;
		}
	}
	for(let i=0; i<vertexCount; i++) {
		for(let j=0; j<vertexCount; j++) {
			feramoneMatrix[i][j] = feramoneMatrix[i][j]*(1 - ro) + feramoneAddMatrix[i][j];
		}
	}

	if(int1) {
		iterations++;
		if(iterations % 20 == 0) {
			let walked = evaluate();
			output += (walked+"").replaceAll(".",",")+"\n";
			console.log((iterations/20)+": "+walked);
		}
		if(iterations == 1000) {
			console.log(output);
			if(int1) {
				clearInterval(int1);
				clearInterval(int2);
				int1 = null;
				id("init").disabled = false;
			}
		}
	}
}

function evaluate() {
	let walked = 0;
	let startPos = 0;
	let curPos = startPos;
	let visited = new Array(vertexCount).fill(false);
	visited[curPos] = true;

	for(let k=1; k<=vertexCount; k++) {
		let newPos = 0;
		if(k < vertexCount) {
			let maxChance = 0;
			for(let j=0; j<vertexCount; j++) {
				if(!visited[j]) {
					let chance = (feramoneMatrix[curPos][j] ** alpha) * ((1 / distanceMatrix[curPos][j]) ** beta);
					if(chance > maxChance) {
						maxChance = chance;
						newPos = j;
					}
				}
			}
		} else {
			newPos = startPos;
		}

		walked += distanceMatrix[curPos][newPos];
		visited[newPos] = true;
		curPos = newPos;
	}
	return walked;
}


id("step").addEventListener("click", () => {
	step();
	draw();
});
id("init").addEventListener("click", () => {
	init();
	draw();
});
id("solve").addEventListener("click", () => {
	if(int1) {
		clearInterval(int1);
		clearInterval(int2);
		int1 = null;
		id("init").disabled = false;
		id("solve").textContent = "Вирішити";
	} else {
		int1 = setInterval(step, 10);
		int2 = setInterval(draw, 100);
		id("init").disabled = true;
		id("solve").textContent = "Зупинити";
	}
});

init();
draw();