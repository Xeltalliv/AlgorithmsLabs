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
let eliteAntRatio = 0.5;
let scatter = 1;
let iterations = 0;
let output = "";
let moreRuns = 0;
let score = 0;
let startShortest = 0;
let shortest = 0;
let visualize = true;
let tests = 25;

let rand = 0.1;
function random() {
	return rand = Math.abs((Math.SQRT2*Math.sin(rand*6712534.28346+(rand*rand/3)%1)+rand*rand*1000 + 0.123)%1);
}

function init() {
	alpha = +id("alpha").value;
	beta = +id("beta").value;
	ro = +id("ro").value;
	vertexCount = +id("vertexCount").value;
	antCount = +id("antCount").value;
	eliteAntRatio = +id("eliteAntRatio").value;
	Lmin = +id("Lmin").value;
	let feramone = +id("feramone").value;
	scatter = +id("scatter").value;
	let chance = +id("chance").value;
	visualize = id("visualize").checked;
	shortest = Infinity;
	iterations = 0;

	points = [];
	distanceMatrix = [];
	feramoneMatrix = [];
	output = "";

	for(let i=0; i<vertexCount; i++) {
		let maxDist = 0;
		let maxPos;
		for(let j=0; j<20; j++) {
			let pos = [random()*35+0.5, random()*35+0.5, 0, -1]
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
			if(j>i && random() < chance) {
				dist += random()*scatter*2-scatter;
			}
			distanceMatrixRow.push(Math.min(5, dist));
			feramoneMatrixRow.push(feramone);
		}
		distanceMatrix.push(distanceMatrixRow);
		feramoneMatrix.push(feramoneMatrixRow);
	}
}

function draw() {
	ctx.save();
	ctx.scale(size / 256, size / 256);
	ctx.clearRect(0, 0, 256, 256);
	let scaler = 256 / 36;
	ctx.textAlign = "center"; 
	ctx.textBaseline = "middle";
	ctx.font = "6px sans serif";
	ctx.strokeStyle = "#000000";
	let lastColor = false;

	for(let i=0; i<vertexCount; i++) {
		for(let j=i+1; j<vertexCount; j++) {
			let thisColor = points[i][3] == j || points[j][3] == i;
			if(feramoneMatrix[i][j] > 0.01 || thisColor) {
				if(lastColor != thisColor) {
					ctx.strokeStyle = thisColor ? "#0000ff" : "#000000";
					lastColor = thisColor;
				}

				ctx.globalAlpha = thisColor ? 1 : Math.atan(feramoneMatrix[i][j] / 5) / Math.PI * 2;
				ctx.beginPath();
				ctx.moveTo(points[i][0] * scaler, points[i][1] * scaler);
				ctx.lineTo(points[j][0] * scaler, points[j][1] * scaler);

				if(distanceMatrix[i][j] !== distanceMatrix[j][i] && feramoneMatrix[i][j] > 0.2) {
					let p1, p2;
					if(distanceMatrix[i][j] < distanceMatrix[j][i]) {
						p1 = points[i];
						p2 = points[j];
					} else {
						p1 = points[j];
						p2 = points[i];
					}
					let dx = p2[0] - p1[0];
					let dy = p2[1] - p1[1];
					let length = Math.sqrt(dx*dx+dy*dy);
					dx /= length;
					dy /= length;

					ctx.moveTo(p2[0] * scaler - 3*dx     , p2[1] * scaler - 3*dy);
					ctx.lineTo(p2[0] * scaler - 4*dx - dy, p2[1] * scaler - 4*dy + dx);
					ctx.lineTo(p2[0] * scaler - 4*dx     , p2[1] * scaler - 4*dy);

					ctx.moveTo(p1[0] * scaler + 3*dx     , p1[1] * scaler + 3*dy);
					ctx.lineTo(p1[0] * scaler + 4*dx + dy, p1[1] * scaler + 4*dy - dx);
					ctx.lineTo(p1[0] * scaler + 4*dx     , p1[1] * scaler + 4*dy);
				}
				ctx.closePath();
				ctx.stroke();
			}
		}
	}
	for(let i=0; i<vertexCount; i++) {
		for(let j=i+1; j<vertexCount; j++) {
			let thisColor = points[i][3] == j || points[j][3] == i;
			if(feramoneMatrix[i][j] || thisColor) {
				ctx.globalAlpha = thisColor ? 1 : Math.atan(feramoneMatrix[i][j] / 5) / Math.PI * 2;
				if(distanceMatrix[i][j] !== distanceMatrix[j][i]) {
					let p1, p2, v1, v2;
					if(distanceMatrix[i][j] < distanceMatrix[j][i]) {
						p1 = points[i];
						p2 = points[j];
						v1 = distanceMatrix[i][j];
						v2 = distanceMatrix[j][i];
					} else {
						p1 = points[j];
						p2 = points[i];
						v1 = distanceMatrix[j][i];
						v2 = distanceMatrix[i][j];
					}
					let dx = p2[0] - p1[0];
					let dy = p2[1] - p1[1];
					let length = Math.sqrt(dx*dx+dy*dy);
					dx /= length;
					dy /= length;
					ctx.fillStyle = "#00ff00";
					ctx.fillText(Math.round(v1*10)/10, (p1[0] + p2[0])/2 * scaler - 3*dy, (p1[1] + p2[1])/2 * scaler + 3*dx);
					ctx.fillStyle = "#ff0000";
					ctx.fillText(Math.round(v2*10)/10, (p1[0] + p2[0])/2 * scaler + 3*dy, (p1[1] + p2[1])/2 * scaler - 3*dx);
				}
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

	id("state").textContent = "Ітерація ("+iterations+"/50) Колонія ("+(tests - moreRuns)+"/"+tests+") Покращення: "+score.toFixed(2);
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

	let eliteAntCount = antCount*eliteAntRatio;

	for(let i=0; i<antCount; i++) {
		let walked = 0;
		let startPos = randomInt(vertexCount);
		let curPos = startPos;
		let visited = new Array(vertexCount).fill(false);
		visited[curPos] = true;
		let path = [curPos];

		for(let k=1; k<=vertexCount; k++) {
			let newPos = 0;
			if(k < vertexCount) {
				if(i <= eliteAntCount) {
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
				}
			} else {
				newPos = startPos;
			}

			walked += distanceMatrix[curPos][newPos];
			let add = Lmin / walked;
			feramoneAddMatrix[curPos][newPos] += add;
			feramoneAddMatrix[newPos][curPos] += add;
			visited[newPos] = true;
			path.push(newPos);
			curPos = newPos;
		}
		if(walked < shortest) {
			shortest = walked;
			console.log(shortest);
			for(let j=1; j<path.length; j++) {
				points[path[j-1]][3] = path[j];
			}
		}
	}
	for(let i=0; i<vertexCount; i++) {
		for(let j=0; j<vertexCount; j++) {
			feramoneMatrix[i][j] = feramoneMatrix[i][j]*(1 - ro) + feramoneAddMatrix[i][j];
		}
	}

	if(iterations == 0) {
		startShortest = shortest;
	}

	iterations++;
	if(iterations < 50) {
		if(visualize) {
			draw();
		}
		window.requestAnimationFrame(step);
	} else if(moreRuns > 0) {
		score += startShortest - shortest;
		console.log("result", startShortest - shortest);
		iterations = 0;
		moreRuns--;
		draw();
		init();
		window.setTimeout(step, 0);
	} else {
		score += startShortest - shortest;
		console.log("total score", score);
		alert("total score "+score);
	}
}

id("test").addEventListener("click", () => {
	rand = 0.15;
	score = 0;
	tests = +id("tests").value;
	moreRuns = tests - 1;
	init();
	step();
});