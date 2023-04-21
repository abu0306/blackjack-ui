import createjs from 'createjs-npm';

export const imgs = {
	cards: {
		path: 'src/assets/PNG/Cards/',
		ext: 'png',
		back: {
			blue: 'cardBack_blue5',
			red: 'cardBack_red5',
		},
		get: function (suit, value) {
			const map= {
				"0": "A",
				"1": "2",
				"2": "3",
				"3": "4",
				"4": "5",
				"5": "6",
				"6": "7",
				"7": "8",
				"8": "9",
				"9": "10",
				"10" :"J",
				"12": "K",
				"11": "Q",
			 }
			return `${this.path}card${suit}${map[value]}.${this.ext}`;
		},
	},
	chips: {
		path: 'src/assets/PNG/Chips/',
		ext: 'png',
		black: {
			main: 'chipBlackWhite',
			side: 'chipBlackWhite_side'
		},
		blue: {
			main: 'chipBlueWhite',
			side: 'chipBlueWhite_side'
		},
		green: {
			main: 'chipGreenWhite',
			side: 'chipGreenWhite_side'
		},
		red: {
			main: 'chipRedWhite',
			side: 'chipRedWhite_side'
		},
		white: {
			main: 'chipWhiteBlue',
			side: 'chipWhiteBlue_side'
		},
		get: function(color, type = 'main'){
			return `${this.path}${this[color][type]}.${this.ext}`;
		}
	}
};

export const deckNumber = 6;
export const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];



export function suits_num(a) { 
	const num = Number(a)
	if (num < 14) {
		return 'Spades'; //黑桃
	} else if (num < 27) {
		return 'Hearts'; //红桃
	} else if (num < 40) { 
		return 'Clubs' //梅花
	} 
	return 'Diamonds' //梅花
}



export const messages = {
	bet: 'Bet !',
	win: 'You win !',
	draw: 'Draw !',
	lose: 'Dealer wins',
	warning: {
		bet: {msg: 'You need to start first', x: 750},
		insurance: {msg: 'You can not use insurance', x: 725},
		insured: {msg:'insurance used !', x: 800},
		double: {msg: 'You can not double now', x: 725},
		funds: {msg: "You haven't got enough funds", x: 680},
		hit: {msg: 'You can not hit anymore', x: 720},
		doubled: {msg: 'Bet doubled !', x: 800},
		giveUp: {msg: 'You can not give up now !', x: 720},
		gaveUp: {msg: 'You gave up', x: 800}
	},
};

export const width = 1100;
export const height = 650;

createjs.Text.prototype.center = function(x = true, y = false){
	var bounds = this.getBounds();
	if(x) this.x = (width / 2) - (bounds?.width / 2);
	if(y) this.y = (height / 2) - (bounds?.height / 2);
};

export function rand(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function l(v){
	console.log(v);
}

export function t(v){
	console.table(v);
}
