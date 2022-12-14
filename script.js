var movingCanvas = document.querySelector("#movingCanvas");
var notMovingCanvas = document.querySelector("#notMovingCanvas");
var statusCanvas = document.querySelector("#status");
var movingCanvasCtx = movingCanvas.getContext("2d");
var notMovingCanvasCtx = notMovingCanvas.getContext("2d");
var statusCanvasCtx = statusCanvas.getContext("2d");
var scale = (innerHeight - (innerHeight % 50)) / 1000;
var currentScale = scale;
var tileSize = Math.floor(50 * scale);
var mapHeight = 20;
var mapWidth = 42;
var guiGridSize = 8 * tileSize;
var changeScale = false;
var backgroundLoaded = false;
movingCanvas.height = mapHeight * tileSize;
movingCanvas.width = mapWidth * tileSize;
notMovingCanvas.height = mapHeight * tileSize;
notMovingCanvas.width = mapWidth * tileSize;
statusCanvas.height = mapHeight * tileSize;
statusCanvas.width = mapWidth * tileSize;
var fontSize = 40 * scale;
movingCanvasCtx.font = `${fontSize}px Georgia`;
movingCanvasCtx.textAlign = "center";
var movingCanvasBounding = movingCanvas.getBoundingClientRect();

const control = {
	left: false,
	right: false,
	jump: false,
	mine: false,
	climb: false,
	climbUp: false,
	climbDown: false,
	mouseX: undefined,
	mouseY: undefined,
	openInventory: false
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
var ladderList = [];

var gameFrame = 0;
var currentMineRegenTime = 0;
var mineRegenTime = 3000;

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
var ladderImage = new Image();
ladderImage.src = "source/img/ladder.png";

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
			x: movingCanvas.width / 2,
			y: movingCanvas.height / 2
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
		this.currentRunVelocity = this.runSpeed;
		this.pickaxe = "stone";
		this.mineDelay = 200;
		this.mineCount = this.mineDelay;
		this.maxHP = 10;
		this.currentHP = this.maxHP;
		this.reachLimitX = 2.5 * tileSize;
		this.reachLimitY = 2 * tileSize;
		this.toggleClimb = false;
		this.climbing = false;
		this.climbSpeed = 5 * scale;
		this.selectedLadder = undefined;
	}
	fall() {
		var selectedPlatform = platformList.find(platform => {
			return checkCollision(platform, this) && this.position.y < platform.position.y;
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
	climb() {
		player.selectedLadder = ladderList.find(ladder => {return checkCollision(player, ladder);});
		if (this.selectedLadder == undefined && this.climbing) {
			this.onLand = false;
			this.frameY = 1;
			this.prevFrameY = this.frameY;
			this.climbing = false;
			control.climbUp = false;
			control.climbDown = false;
			return;
		}
		if ((this.onLand || control.jump) && control.climb && !this.toggleClimb && this.selectedLadder != undefined) {
			this.climbing = !this.climbing;
			this.toggleClimb = true;
			this.onLand = true;
			control.jump = false;
		}
		if (this.climbing) {
			this.frameY = 4;
			this.position.x = this.selectedLadder.position.x;
			this.position.y += this.climbSpeed * (control.climbDown - control.climbUp);
			if (this.position.y > movingCanvas.height - this.height - tileSize / 2) this.position.y = movingCanvas.height - this.height - tileSize / 2;
			control.left = false;
			control.right = false;
		}
		else if (!this.climbing && this.toggleClimb) { 
			this.onLand = false;
			this.frameY = 1;
			this.prevFrameY = this.frameY;
		}
	}
	run() {
		if (this.onLand && control.right - control.left != 0) walkSound.play();
		else walkSound.pause();
		this.position.x += this.currentRunVelocity * (control.right - control.left);
		if (this.position.x < 0) {
			this.position.x = 0;
			walkSound.pause();
		}
		else if (this.position.x + this.width > movingCanvas.width) {
			this.position.x = movingCanvas.width - this.width;
			walkSound.pause();
		}
	}
	mine() {
		if (control.mine && this.onLand && this.mineCount == this.mineDelay && control.mouseY != undefined && 
			control.mouseX >= this.position.x - this.reachLimitX && control.mouseX < this.position.x + this.reachLimitX && 
			control.mouseY >= this.position.y - this.reachLimitY && control.mouseY < this.position.y + this.reachLimitY) {
			this.prevFrameY = (control.mouseX < this.position.x) ? 1 : 0;
			this.frameY = this.prevFrameY + 2;
			this.frameX = 1;
			this.mineCount = 0;
			var selectedOre = oreList.find(ore => {
				return (ore.position.x == control.mouseX && ore.position.y == control.mouseY);
			});
			var selectedOreIndex = oreList.indexOf(selectedOre);
			if (selectedOre === undefined) {
				this.frameY = this.prevFrameY;
				control.mine = false;
				return;
			}
			selectedOre.currentHardness -= pickaxe[this.pickaxe].dmg;
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
			selectedOre.draw();
			if (this.frameX == 1) swingSound.play();
		};
		if (this.frameX == 3) this.frameY = this.prevFrameY;
		if(this.mineCount < this.mineDelay) this.mineCount++;
	}
	draw() {
		this.climb();
		this.jump();
		this.run();
		if (!this.climbing) this.mine();
		if (gameFrame % 100 == 0) this.frameX++;
		statusCanvasCtx.lineWidth = 1;
		if (control.mouseX >= this.position.x - this.reachLimitX && control.mouseX < this.position.x + this.reachLimitX && 
			control.mouseY >= this.position.y - this.reachLimitY && control.mouseY < this.position.y + this.reachLimitY && this.onLand && !this.climbing) {
			statusCanvasCtx.strokeStyle = "lime";
		}
		else {
			statusCanvasCtx.strokeStyle = "red";
			statusCanvasCtx.beginPath();
			statusCanvasCtx.moveTo(control.mouseX, control.mouseY);
			statusCanvasCtx.lineTo(control.mouseX + tileSize, control.mouseY + tileSize);
			statusCanvasCtx.stroke();
			statusCanvasCtx.beginPath();
			statusCanvasCtx.moveTo(control.mouseX + tileSize, control.mouseY);
			statusCanvasCtx.lineTo(control.mouseX, control.mouseY + tileSize);
			statusCanvasCtx.stroke();
		}
		statusCanvasCtx.strokeRect(control.mouseX, control.mouseY, tileSize, tileSize);
		movingCanvasCtx.drawImage(
			playerImage, 
			(this.frameX % 4) * this.imgSize, 
			this.frameY * this.imgSize, 
			this.imgSize, this.imgSize, 
			this.position.x, this.position.y, 
			this.spriteWidth, this.spriteHeight
		);
		if (this.selectedLadder != undefined && !this.climbing) {
			movingCanvasCtx.fillStyle = "white";
			movingCanvasCtx.fillText("E", this.position.x + this.width / 2, this.position.y - 10);
		}
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
		movingCanvasCtx.fillStyle = this.color;
		movingCanvasCtx.fillText(this.text, this.position.x, this.position.y);
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
			else if (this.position.x + this.width > movingCanvas.width) this.position.x = movingCanvas.width - this.width;
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
		movingCanvasCtx.fillStyle = "black";
		movingCanvasCtx.fillRect(this.position.x, this.position.y, this.width, this.height);
		movingCanvasCtx.drawImage(droppedOreImage, oreType[this.block].tier * 40, 0, 40, 40, this.position.x, this.position.y, this.width, this.width);
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
			notMovingCanvasCtx.drawImage(oreImage, oreType[this.block].tier * 64, 0, 64, 64, this.position.x, this.position.y, this.width, this.height);
			notMovingCanvasCtx.fillStyle = "rgba(255, 0, 0, 0.2)";
			notMovingCanvasCtx.fillRect(this.position.x, this.position.y + tileSize * (this.currentHardness / this.maxHardness), tileSize, tileSize * (1 - this.currentHardness / this.maxHardness));
		}
		else notMovingCanvasCtx.clearRect(this.position.x, this.position.y, tileSize, tileSize);
	}
}

class Platform {
	constructor({position}) {
		this.position = position;
		this.width = tileSize;
		this.height = tileSize / 2;
	}
	draw() {
		notMovingCanvasCtx.drawImage(platformImage, 0, 0, 64, 32, this.position.x, this.position.y, this.width, this.height);
	}
}

class Ladder {
	constructor({position}) {
		this.position = position;
		this.width = tileSize;
		this.height = tileSize;
		this.img = ladderImage;
	}
	draw() {
		notMovingCanvasCtx.drawImage(ladderImage, 0, 0, 64, 64, this.position.x, this.position.y, tileSize, tileSize);
	}
}

class GUI {
	static isOpen = false;
	static toggleGUI = false;
	static width = 35 * tileSize;
	static height = 18 * tileSize;
	static position = {
		x: (movingCanvas.width - GUI.width) / 2,
		y: (movingCanvas.height - GUI.height) / 2,
	}
	static update() {
		if (control.openInventory && !GUI.toggleGUI) {
			GUI.isOpen = !GUI.isOpen;
			GUI.toggleGUI = true;
		}
		if (GUI.isOpen) {
			control.left = false;
			control.right = false;
			control.jump = false;
		}
	}	
	static show() {
		statusCanvasCtx.strokeStyle = "black";
		statusCanvasCtx.lineWidth = 5;
		statusCanvasCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
		statusCanvasCtx.fillRect(GUI.position.x, GUI.position.y, GUI.width, GUI.height);
		statusCanvasCtx.strokeRect(GUI.position.x, GUI.position.y, GUI.width, GUI.height);
	}
	static draw() {
		GUI.update();
		if (GUI.isOpen) GUI.show();
	}
}

function createEmptyCell() {
	for (let row = 0; row < movingCanvas.height - guiGridSize; row += tileSize) {
		for (let column = 0; column < movingCanvas.width; column += tileSize) {
			emptyTileList.push([column, row]);
		}
	}
}

function createOre() {
	for (let i = 0; i < movingCanvas.width * (movingCanvas.height - guiGridSize)/ Math.pow(tileSize, 2); i++) {
		var randomIndex = Math.floor(Math.random() * (emptyTileList.length - 1));
		var newX = emptyTileList[randomIndex][0];
		var newY = emptyTileList[randomIndex][1];
		emptyTileList.splice(randomIndex, 1);
		var abundance = Math.floor(Math.random() * 100);
		var foundOre = false;
		var currentBlock = Object.keys(oreType).find(ore => {
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
	for (let row = 0; row < 2; row++) {
		for (let column = 0; column < movingCanvas.width; column += tileSize) {
			platformList.push(new Platform({
				position: {
					x: column,
					y: movingCanvas.height - ((row == 0) ? guiGridSize : tileSize / 2)
				}
			}));
		}
	}
}

function createLadder() {
	for (let row = movingCanvas.height - guiGridSize; row < movingCanvas.height; row += tileSize) {
		ladderList.push(new Ladder({
			position: {
				x: 38 * tileSize,
				y: row - 10
			}
		}));
	}
}

function mineRegen() {
	if (emptyTileList.length > 0 && currentMineRegenTime < mineRegenTime) currentMineRegenTime++;
	if (currentMineRegenTime == mineRegenTime && emptyTileList.length > 0) {
		var tile = emptyTileList[0];
		var abundance = Math.floor(Math.random() * 100);
		var currentBlock = Object.keys(oreType).find(ore => {
			return (oreType[ore].minAbundance <= abundance && oreType[ore].maxAbundance >= abundance);
		});
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
	ladderList[0].draw();
	if (oreImage.complete && platformImage.complete && ladderImage.complete) {
		oreList.forEach(ore => ore.draw());
		platformList.forEach(platform => platform.draw());	
		ladderList.forEach(ladder => ladder.draw());	
		backgroundLoaded = true;
	}
}

function animate() {
	statusCanvasCtx.clearRect(0, 0, movingCanvas.width, movingCanvas.height);
	GUI.draw();
	if (!changeScale) {
		if (!GUI.isOpen) {
			movingCanvasCtx.clearRect(0, 0, movingCanvas.width, movingCanvas.height);
			mineRegen();
			dropItemList.forEach(chunk => chunk.draw());
			textList.forEach(text => text.draw());
			player.draw();
			gameFrame++;
			if (!backgroundLoaded) notAnimate();
		}
		else {
			walkSound.pause();
		}
	}
}

function onLoad() {
	createEmptyCell();
	createOre();
	createPlatform();
	createLadder();
	window.setInterval(animate, 8);
}

onLoad();

window.addEventListener("keydown", event => {
	//bgm1.play();
	switch(event.key.toLowerCase()) {
		case 'w':
			if (GUI.isOpen) return;
			if (!player.climbing) control.jump = true;
			else {
				control.climbUp = true;
				control.climbDown = false;
			}
			break;
		case 's':
			if (GUI.isOpen) return;
			if (player.climbing) {
				control.climbUp = false;
				control.climbDown = true;
			}
			break;
		case 'a':
			if (GUI.isOpen) return;
			control.left = true;
			control.right = false;
			if (player.climbing) {
				player.climbing = false;
				control.climbUp = false;
				control.climbDown = false;
				player.onLand = false;
				control.jump = true;
			}
			player.frameY = 1;
			player.prevFrameY = player.frameY;
			break;
		case 'd':
			if (GUI.isOpen) return;
			control.left = false;
			control.right = true;
			if (player.climbing) {
				player.climbing = false;
				control.climbUp = false;
				control.climbDown = false;
				player.onLand = false;
				control.jump = true;
			}
			player.frameY = 0;
			player.prevFrameY = player.frameY;
			break;
		case 'e':
			if (player.selectedLadder != undefined) control.climb = true;
			else control.openInventory = true;
			break;
		case 'Tab':

	}
});

window.addEventListener("keyup", event => {
	switch(event.key.toLowerCase()) {
		case 'w': if (player.climbing) control.climbUp = false; break;
		case 's': if (player.climbing) control.climbDown = false; break;
		case 'a': control.left = false; break;
		case 'd': control.right = false; break;
		case 'e': 
		if (player.selectedLadder != undefined) {
			control.climb = false; 
			player.toggleClimb = false;
		}
		else {
			control.openInventory = false;
			GUI.toggleGUI = false;
		}
		break;
	}
});

statusCanvas.addEventListener("mousemove", event => {
	if (GUI.isOpen) return;
	if (control.mouseX != (event.x - movingCanvasBounding.left) - ((event.x - movingCanvasBounding.left) % tileSize) ||
		control.mouseY != (event.y - movingCanvasBounding.top) - ((event.y - movingCanvasBounding.top) % tileSize)) {
		control.mouseX = (event.x - movingCanvasBounding.left) - ((event.x - movingCanvasBounding.left) % tileSize);
		control.mouseY = (event.y - movingCanvasBounding.top) - ((event.y - movingCanvasBounding.top) % tileSize);
		control.mine = false;
	}
	if (control.mouseY >= movingCanvas.height - guiGridSize) {
		control.mouseX = undefined;
		control.mouseY = undefined;
		control.mine = false;
	}
});

statusCanvas.addEventListener("mousedown", event => {
	//bgm1.play();
	if (GUI.isOpen) return;
	if (player.onLand && player.mineCount == player.mineDelay) control.mine = true;
});

window.addEventListener("resize", event => {
	changeScale = true;
	movingCanvasBounding = movingCanvas.getBoundingClientRect();
	changeScale = false;
});