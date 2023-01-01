let rot = 0;

async function throwCube() {
	let canvas = id("canvas");
	let ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	let x=Math.random()*200-100;
	let y=50;
	let z=Math.random()*200-100;
	let r=0;
	let vx=Math.random()*10-5;
	let vy=0;
	let vz=Math.random()*10-5;
	let vr=(Math.random()*10-5)/20;
	let imageNow = Math.floor(Math.random()*6);
	let imageNext = Math.floor(Math.random()*5);
	if(imageNext == imageNow) imageNext = 5;
	let dir=2;
	const halfPi = Math.PI/2;
	while(true) {
		let speed = Math.sqrt(vx*vx+vz*vz)
		rot += speed/50 + 0.5/((1+speed)**3);
		if(rot > halfPi) {
			rot = rot % halfPi;
			if(Math.abs(vy) < 2 && Math.abs(y) < 0.1) rot = 0;
			imageNow = imageNext;
			imageNext = Math.floor(Math.random()*5);
			if(imageNext == imageNow) imageNext = 5;
			dir = Math.floor(Math.random()*4);
		}
		vy -= 1;
		x += vx;
		y += vy;
		z += vz;
		r += vr;
		if(y < 0) {
			y = 0;
			vy = vy * -0.8;
			vx = vx * 0.8 - x / 10;
			vz = vz * 0.8 - z / 10;
			vr = Math.random()*speed/100; //vr * 0.8;
		}
		ctx.fillStyle="#888";
		ctx.fillRect(0,0,400,400);
		ctx.save();
		ctx.translate(200+20*x/(60-y), 200+20*z/(60-y));
		ctx.rotate(r);
		ctx.scale(60/(60-y),60/(60-y));
		if(dir == 0) {
			let s = Math.sin(rot);
			let c = Math.cos(rot);
			let x1 = (-1)*c - 1*s;
			let x2 = ( 1)*c - 1*s;
			let x3 = ( 1)*c + 1*s;
			ctx.drawImage(images[imageNow], 20*x1, -20, 20*(x2-x1), 40);
			ctx.drawImage(images[imageNext], 20*x2, -20, 20*(x3-x2), 40);
		}
		if(dir == 1) {
			let s = Math.sin(rot);
			let c = Math.cos(rot);
			let x1 = (-1)*c + 1*s;
			let x2 = ( 1)*c + 1*s;
			let x0 = (-1)*c - 1*s;
			ctx.drawImage(images[imageNow], 20*x1, -20, 20*(x2-x1), 40);
			ctx.drawImage(images[imageNext], 20*x0, -20, 20*(x1-x0), 40);
		}
		if(dir == 2) {
			let s = Math.sin(rot);
			let c = Math.cos(rot);
			let x1 = (-1)*c - 1*s;
			let x2 = ( 1)*c - 1*s;
			let x3 = ( 1)*c + 1*s;
			ctx.drawImage(images[imageNow], -20, 20*x1, 40, 20*(x2-x1));
			ctx.drawImage(images[imageNext], -20, 20*x2, 40, 20*(x3-x2));
		}
		if(dir == 3) {
			let s = Math.sin(rot);
			let c = Math.cos(rot);
			let x1 = (-1)*c + 1*s;
			let x2 = ( 1)*c + 1*s;
			let x0 = (-1)*c - 1*s;
			ctx.drawImage(images[imageNow], -20, 20*x1, 40, 20*(x2-x1));
			ctx.drawImage(images[imageNext], -20, 20*x0, 40, 20*(x1-x0));
		}
		ctx.restore();
		if(rot == 0 && Math.abs(vy) < 2 && Math.abs(y) < 0.1) break;
		await waitFrame();
	}
	players[currentPlayer].numberSum += imageNow+1;
	render();
}

let images = [];
for(let i=1; i<7; i++) {
	let img = new Image();
	img.src = "images/"+i+".png";
	images.push(img);
}

async function waitFrame() {
	return new Promise(resolve => requestAnimationFrame(resolve));
}