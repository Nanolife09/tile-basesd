var moving = document.querySelector("#moving");
var notMoving = document.querySelector("#notMoving");
var ctx = moving.getContext("2d");
var ctx1 = notMoving.getContext("2d");
var scale = (innerHeight - (innerHeight % 50)) / 1000;
var currentScale = scale;
var tileSize = Math.floor(50 * scale);
var mapHeight = 20;
var mapWidth = 42;
var guiGridSize = 8 * tileSize;
var changeScale = false;
var backgroundLoaded = false;
moving.height = mapHeight * tileSize;
moving.width = mapWidth * tileSize;
notMoving.height = mapHeight * tileSize;
notMoving.width = mapWidth * tileSize;
var fontSize = 40 * scale;
ctx.font = `${fontSize}px Georgia`;
ctx.textAlign = "center";
var movingBounding = moving.getBoundingClientRect();

const control = {
	left: false,
	right: false,
	jump: false,
	mine: false,
	mouseX: undefined,
	mouseY: undefined,
};

const oreType = {
	"stone": {
		tier: 0,
		hardness: 5,
		minDrop: 2,
		maxDrop: 4,
		minAbundance: 0,
		maxAbundance: 98
	},
	"iron": {
		tier: 1,
		hardness: 10,
		minDrop: 2,
		maxDrop: 4,
		minAbundance: 99,
		maxAbundance: 100
	},
	"silver": {
		tier: 2,
		hardness: 20,
		minDrop: 2,
		maxDrop: 3,
		minAbundance: 0,
		maxAbundance: 0
	},
	"gold": {
		tier: 3,
		hardness: 60,
		minDrop: 2,
		maxDrop: 2,
		minAbundance: 0,
		maxAbundance: 0
	},
	"emerald": {
		tier: 4,
		hardness: 240,
		minDrop: 2,
		maxDrop: 2,
		minAbundance: 0,
		maxAbundance: 0
	},
	"sapphire": {
		tier: 5,
		hardness: 1200,
		minDrop: 1,
		maxDrop: 2,
		minAbundance: 0,
		maxAbundance: 0
	},
	"ruby": {
		tier: 6,
		hardness: 7200,
		minDrop: 1,
		maxDrop: 2,
		minAbundance: 0,
		maxAbundance: 0
	},
	"diamond": {
		tier: 7,
		hardness: 50400,
		minDrop: 1,
		maxDrop: 1,
		minAbundance: 0,
		maxAbundance: 0
	},
	"amethyst": {
		tier: 8,
		hardness: 403200,
		minDrop: 1,
		maxDrop: 1,
		minAbundance: 0,
		maxAbundance: 0
	},
	"blackOpal": {
		tier: 9,
		hardness: 3628800,
		minDrop: 0,
		maxDrop: 1,
		minAbundance: 0,
		maxAbundance: 0
	}
};

const pickaxe = {
	"stone": {
		tier: 0,
		dmg: 1
	},
	"iron": {
		tier: 1,
		dmg: 2
	},
	"silver": {
		tier: 2,
		dmg: 4
	},
	"gold": {
		tier: 3,
		dmg: 12,
	},
	"emerald": {
		tier: 4,
		dmg: 48,
	},
	"sapphire": {
		tier: 5,
		dmg: 240,
	},
	"ruby": {
		tier: 6,
		dmg: 1440,
	},
	"diamond": {
		tier: 7,
		dmg: 10080
	},
	"amethyst": {
		tier: 8,
		dmg: 80640
	},
	"blackOpal": {
		tier: 9,
		dmg: 725760
	}
}

var inventory = {
	"stone": 0,
	"iron": 0,
	"silver": 0,
	"gold": 0,
	"emerald": 0,
	"sapphire": 0,
	"ruby": 0,
	"diamond": 0,
	"amethyst": 0,
	"blackOpal": 0
}

var oreList = [];
var dropItemList = [];
var emptyTileList = [];
var textList = [];
var platformList = [];
var inventorySlotList = [];

var gameFrame = 0;
var currentMineRegenTime = 0;
var mineRegenTime = 50;

var playerImage = new Image();
playerImage.src = "source/img/miner.png";
var oreImage = new Image();
oreImage.src = "source/img/ore.png";
var droppedOreImage = new Image();
droppedOreImage.src = "source/img/oreItem.png";
var pickaxeImage = new Image();
pickaxeImage.src = "source/img/pickaxe.png";
var platformImage = new Image();
platformImage.src = "source/img/platform.png";

var bgm1 = new Audio();
bgm1.src = "source/sound/bgm3.ogg";
var jumpSound = new Audio();
jumpSound.src = "source/sound/jump.flac";
var walkSound = new Audio();
walkSound.src = "source/sound/walk.mp3";
var swingSound = new Audio();
swingSound.src = "source/sound/swing.mp3";
var miningSound = new Audio();
miningSound.src = "source/sound/mining.mp3";
var oreBreakSound = new Audio();
oreBreakSound.src = "source/sound/oreBreak.ogg";
var itemCollectSound = new Audio();
itemCollectSound.src = "source/sound/itemCollect.mp3";

function checkCollision(object1, object2) {
	return object1.position.x <= object2.position.x + object2.width &&
		object1.position.x + object1.width >= object2.position.x &&
		object1.position.y + object1.height >= object2.position.y &&
		object1.position.y <= object2.position.y + object2.height;
}

class Player {
	constructor() {
		this.position = {
			x: moving.width / 2,
			y: moving.height / 2
		};
		this.width = 45 * scale;
		this.height = 64 * scale;
		this.imgSize = 64;
		this.spriteWidth = this.imgSize * scale;
		this.spriteHeight = this.imgSize * scale;
		this.frameX = 0;
		this.frameY = 0;
		this.prevFrameY = this.frameY;
		this.onLand = false;
		this.gravity = 0.1 * scale;
		this.jumpSpeed = -4.5 * scale;
		this.fallSpeed = 2 * scale;
		this.currentJumpVelocity = this.fallSpeed;
		this.runSpeed = 3 * scale;
		this.runAcceleration = 0.2 * scale;
		this.maxRunSpeed = 5 * scale;
		this.currentRunVelocity = this.runSpeed;
		this.pickaxe = "stone";
		this.mineDelay = 20;
		this.mineCount = this.mineDelay;
		this.maxHP = 10;
		this.currentHP = this.maxHP;
		this.reachLimitX = 5 * tileSize;
		this.reachLimitY = 3 * tileSize;
	}
	fall() {
		var selectedPlatform = platformList.find(platform => {
			return checkCollision(platform, this);
		});
		this.currentJumpVelocity += this.gravity;
		this.position.y += this.currentJumpVelocity;
		if (selectedPlatform == undefined) return;
		this.position.y = selectedPlatform.position.y - this.height;
		this.currentJumpVelocity = this.fallSpeed;
		this.onLand = true;
		control.jump = false;
	}
	jump() {
		if (!this.onLand && this.currentJumpVelocity >= 0) this.fall();
		else if (this.onLand && control.jump) {
			this.currentJumpVelocity = this.jumpSpeed;
			this.onLand = false;
			jumpSound.play();
			swingSound.pause();
			this.frameY = this.prevFrameY;
			this.frameX += 4;
		}
		if (this.currentJumpVelocity < 0) {
			this.currentJumpVelocity += this.gravity;
			this.position.y += this.currentJumpVelocity;
			control.mine = false;
		}
	}
	run() {
		if (Math.abs(this.currentRunVelocity < this.maxRunSpeed)) this.currentRunVelocity += this.runAcceleration;
		if (control.right - control.left == 0) this.currentRunVelocity = this.runSpeed;
		if (this.onLand && control.right - control.left != 0) walkSound.play();
		else walkSound.pause();
		this.position.x += this.currentRunVelocity * (control.right - control.left);
		if (this.position.x < 0) {
			this.position.x = 0;
			walkSound.pause();
		}
		else if (this.position.x + this.width > moving.width) {
			this.position.x = moving.width - this.width;
			walkSound.pause();
		}
	}
	mine() {
		if (control.mine && this.onLand && this.mineCount == this.mineDelay && control.mouseY != undefined) {
			this.prevFrameY = (control.mouseX < this.position.x) ? 1 : 0;
			this.frameY = this.prevFrameY + 2;
			this.frameX = 1;
			control.mine = false;
			this.mineCount = 0;
			if (emptyTileList.includes([control.mouseX, control.mouseY]) == -1) return;
			var selectedOre = oreList.find(ore => {
				return (ore.position.x == control.mouseX && ore.position.y == control.mouseY);
			});
			var selectedOreIndex = oreList.indexOf(selectedOre);
			selectedOre.currentHardness -= pickaxe[this.pickaxe].dmg;
			selectedOre.draw();
			if (selectedOre.currentHardness > 0) {
				textList.push(new Text({
					text: `${selectedOre.currentHardness} / ${selectedOre.maxHardness}`, 
					position: {
						x: selectedOre.position.x + selectedOre.width / 2,
						y: selectedOre.position.y - 10
					}
				}));
			}
			else {
				emptyTileList.push([selectedOre.position.x, selectedOre.position.y]);
				oreList.splice(selectedOreIndex, 1);
				oreBreakSound.play();
				var chunks = Math.floor(Math.random() * (oreType[selectedOre.block].maxDrop - oreType[selectedOre.block].minDrop) + oreType[selectedOre.block].minDrop);
				for (let chunk = 0; chunk < chunks; chunk++) {
					dropItemList.push(new OreChunk({
						position: {
							x: selectedOre.position.x + selectedOre.width / 2, 
							y: selectedOre.position.y - selectedOre.height / 2
						},
						velocity: {
							x: Math.random() * 2 * ((Math.random() < 0.5) ? 1 : -1) * scale,
							y: -(Math.random() * 2 + 2) * scale
						},
						block: selectedOre.block
					}));
				}
			}
			miningSound.play();
			if (this.frameX == 1) swingSound.play();
		};
		if (this.frameX == 3) this.frameY = this.prevFrameY;
		if(this.mineCount < this.mineDelay) this.mineCount++;
	}
	draw() {
		this.jump();
		this.run();
		this.mine();
		if (gameFrame % 100 == 0) this.frameX++;
		ctx.strokeRect(control.mouseX, control.mouseY, tileSize, tileSize);
		ctx.drawImage(
			playerImage, 
			(this.frameX % 4) * this.imgSize, 
			this.frameY * this.imgSize, 
			this.imgSize, this.imgSize, 
			this.position.x, this.position.y, 
			this.spriteWidth, this.spriteHeight
		);
	}
}

class Text {
	constructor({text, position}) {
		this.position = position;
		this.text = text;
		this.deltaOpacity = 0.005;
		this.opacity = 1;
		this.color = `rgba(255, 255, 255,${this.opacity})`;
	}
	update() {
		this.position.y -= 0.5;
		this.opacity -= this.deltaOpacity;
		this.color = `rgba(255, 255, 255,${this.opacity})`;
		if (this.opacity <= 0) textList.splice(textList.indexOf(this), 1);
	}
	draw() {
		this.update();
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, this.position.x, this.position.y);
	}
}

const player = new Player();

class OreChunk {
	constructor({position, block, velocity}) {
		this.position = position;
		this.width = 40 * scale;
		this.height = 40 * scale;
		this.block = block;
		this.velocity = velocity;
		this.gravity = 0.1 * scale; 
		this.onLand = false;
	}
	fall() {
		var selectedPlatform = platformList.find(platform => {
			return checkCollision(platform, this);
		});
		if (selectedPlatform != undefined) {
			this.onLand = true;
			this.position.y = selectedPlatform.position.y - this.height;
		}
		if (!this.onLand) {
			this.velocity.y += this.gravity;
			this.position.y += this.velocity.y;
			this.position.x += this.velocity.x;
			if (this.position.x < 0) this.position.x = 0;
			else if (this.position.x + this.width > moving.width) this.position.x = moving.width - this.width;
		}
	}
	collected() {
		if (checkCollision(player, this)) {
			textList.push(new Text({
				text: `+1 ${this.block}`, 
				position: {
					x: this.position.x + this.width / 2,
					y: this.position.y - 10 - (fontSize * textList.length)
				}
			}));
			inventory[this.block]++;
			dropItemList.splice(dropItemList.indexOf(this), 1);
			itemCollectSound.currentTime = 0;
			itemCollectSound.play();
		}
	}
	draw() {
		this.onLand = false;
		this.fall();
		this.collected();
		ctx.fillStyle = "black";
		ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
		ctx.drawImage(droppedOreImage, oreType[this.block].tier * 40, 0, 40, 40, this.position.x, this.position.y, this.width, this.width);
	}
}

class Ore {
	constructor({position, block}) {
		this.position = position;
		this.width = tileSize;
		this.height = tileSize;
		this.block = block;
		this.maxHardness = oreType[block].hardness;
		this.currentHardness = this.maxHardness;
	}
	draw() {
		if (this.currentHardness > 0) {
			ctx1.drawImage(oreImage, oreType[this.block].tier * 64, 0, 64, 64, this.position.x, this.position.y, this.width, this.height);
			ctx1.fillStyle = "rgba(255, 0, 0, 0.2)";
			ctx1.fillRect(this.position.x, this.position.y + tileSize * (this.currentHardness / this.maxHardness), tileSize, tileSize * (1 - this.currentHardness / this.maxHardness));
		}
		else ctx1.clearRect(this.position.x, this.position.y, tileSize, tileSize);
	}
}

class Platform {
	constructor({position}) {
		this.position = position;
		this.width = tileSize;
		this.height = tileSize / 2;
	}
	draw() {
		ctx1.drawImage(platformImage, 0, 0, 64, 32, this.position.x, this.position.y, this.width, this.height);
	}
}

function createEmptyCell() {
	for (let row = 0; row < moving.height - guiGridSize; row += tileSize) {
		for (let column = 0; column < moving.width; column += tileSize) {
			emptyTileList.push([column, row]);
		}
	}
}

function createOre() {
	for (let i = 0; i < moving.width * (moving.height - guiGridSize)/ Math.pow(tileSize, 2); i++) {
		var randomIndex = Math.floor(Math.random() * (emptyTileList.length - 1));
		var newX = emptyTileList[randomIndex][0];
		var newY = emptyTileList[randomIndex][1];
		emptyTileList.splice(randomIndex, 1);
		var abundance = Math.floor(Math.random() * 100);
		var foundOre = false;
		var currentBlock = oreType.find(ore => {
			return (oreType[ore].minAbundance <= abundance && oreType[ore].maxAbundance >= abundance);
		});
		var newOre = new Ore({
			position: {
				x: newX,
				y: newY
			},
			block: currentBlock
		});
		oreList.push(newOre);
	}
}

function createPlatform() {
	for (let column = 0; column < moving.width; column += tileSize) {
		platformList.push(new Platform({
			position: {
				x: column,
				y: moving.height - guiGridSize
			}
		}));
	}
}

function mineRegen() {
	if (emptyTileList.length > 0 && currentMineRegenTime < mineRegenTime) currentMineRegenTime++;
	if (currentMineRegenTime == mineRegenTime && emptyTileList.length > 0) {
		var tile = emptyTileList[0];
		var abundance = Math.floor(Math.random() * 100);
		/*var currentBlock = oreType.find(ore => {
			return (oreType[ore].minAbundance <= abundance && oreType[ore].maxAbundance >= abundance);
		});*/
		for (let ore in oreType) {
			if (oreType[ore].minAbundance <= abundance && oreType[ore].maxAbundance >= abundance) {
				currentBlock = ore;
				break;
			}
		}
		oreList.push(new Ore({
			position: {
				x: tile[0],
				y: tile[1]
			},
			block: currentBlock
		}));
		emptyTileList.splice(emptyTileList.indexOf(tile), 1);
		currentMineRegenTime = 0;
		oreList[oreList.length - 1].draw();
	}
} 

function notAnimate() {
	if (oreImage.complete && platformImage.complete) {
		oreList.forEach(ore => ore.draw());
		platformList.forEach(platform => platform.draw());	
		backgroundLoaded = true;
	}
}

function animate() {
	if (!changeScale) {
		ctx.clearRect(0, 0, moving.width, moving.height);
		mineRegen();
		dropItemList.forEach(chunk => chunk.draw());
		textList.forEach(text => text.draw());
		player.draw();
		gameFrame++;
		if (!backgroundLoaded) notAnimate();
	}
	requestAnimationFrame(animate);	
}

createEmptyCell();
createOre();
createPlatform();
animate();

window.addEventListener("keydown", event => {
	//bgm1.play();
	switch(event.key.toLowerCase()) {
		case 'w':
			control.jump = true;
			break;
		case 'a':
			control.left = true;
			control.right = false;
			player.frameY = 1;
			player.prevFrameY = player.frameY;
			break;
		case 'd':
			control.left = false;
			control.right = true;
			player.frameY = 0;
			player.prevFrameY = player.frameY;
			break;
	}
});

window.addEventListener("keyup", event => {
	switch(event.key.toLowerCase()) {
		case 'a': control.left = false; break;
		case 'd': control.right = false; break;
	}
});

moving.addEventListener("mousemove", event => {
	control.mouseX = (event.x - movingBounding.left) - ((event.x - movingBounding.left) % tileSize);
	control.mouseY = (event.y - movingBounding.top) - ((event.y - movingBounding.top) % tileSize);
	if (control.mouseY >= moving.height - guiGridSize) {
		control.mouseX = undefined;
		control.mouseY = undefined;
		control.mine = false;
	}
});

moving.addEventListener("mousedown", event => {
	//bgm1.play();
	if (player.onLand && player.mineCount == player.mineDelay) control.mine = true;
});

window.addEventListener("resize", event => {
	changeScale = true;
	var prevScale = scale;
	scale = (innerHeight - (innerHeight % 50)) / 1000;
	currentScale = scale / prevScale;
	tileSize = Math.floor(tileSize * currentScale);
	guiGridSize = Math.round(8 * tileSize);
	moving.height = Math.round(mapHeight * tileSize);
	moving.width = Math.round(mapWidth * tileSize);
	movingBounding = moving.getBoundingClientRect();
	oreList.forEach(ore => {
		ore.position.x = Math.round(ore.position.x * currentScale);
		ore.position.y = Math.round(ore.position.y * currentScale);
		ore.width = Math.round(ore.width * currentScale);
		ore.height = Math.round(ore.height * currentScale);
	});
	emptyTileList.forEach(tile => {
		tile[0] = Math.round(tile[0] * currentScale);
		tile[1] = Math.round(tile[1] * currentScale); 
	});
	dropItemList.forEach(item => {
		item.position.x = Math.round(item.position.x * currentScale);
		item.position.y = Math.round(item.position.y * currentScale);
		item.width = Math.round(item.width * currentScale);
		item.height = Math.round(item.height * currentScale);
		item.velocity *= currentScale;
		item.gravity *= currentScale; 
	});
	platformList.forEach(platform => {
		platform.position.x = Math.round(platform.position.x * currentScale);
		platform.position.y = Math.round(platform.position.y * currentScale);
		platform.width = Math.round(platform.width * currentScale);
		platform.height = Math.round(platform.height * currentScale);
	});
	textList.forEach(text => {
		text.position.x *= currentScale;
		text.position.y *= currentScale;
	});
	player.position.x = Math.round(player.position.x * currentScale);
	player.position.y = Math.round(player.position.y * currentScale);
	player.width = Math.round(player.width *currentScale);
	player.height = Math.round(player.height * currentScale);
	player.spriteWidth = Math.round(player.spriteWidth * currentScale);
	player.spriteHeight = Math.round(player.spriteHeight * currentScale);
	player.gravity *= currentScale;
	player.jumpSpeed *= currentScale;
	player.fallSpeed *= currentScale;
	player.currentJumpVelocity = this.fallSpeed;
	player.runSpeed *= currentScale;
	player.runAcceleration *= currentScale;
	player.maxRunSpeed *= currentScale;
	player.currentRunVelocity = this.runSpeed;
	fontSize = 40 * currentScale;
	ctx.font =  `${fontSize}px Georgia`;
	ctx.textAlign = "center";
	changeScale = false;
});