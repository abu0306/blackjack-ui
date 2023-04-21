import { useEffect, useState,useRef } from 'react'
import './App.css'

import init, { RecordCiphertext } from '@aleohq/wasm';
import createjs from 'createjs-npm';
import { Button } from './js/button';
import { deckNumber, imgs, messages, rand,suits_num, suits } from './js/conf';
import { TextInput } from './js/CreateJSTextInput';
import { Card } from './js/card';
import { decodeNum ,decode} from './test'
// Initialize WASM
await init("../node_modules/@aleohq/wasm/aleo_wasm_bg.wasm");

import { AleoNetworkClient,Account } from "@aleohq/sdk";
import BlackJack from './blackjack';
import BlackJackHm from './blackjack_hm';
import { mark } from 'regenerator-runtime';
function parsedNoNormalJsonString(str) {
  return JSON.parse(str.replace(/\.(public|private|u128|u64)/g,'').replace(/(\w+)\s*:/g, '"$1":').replace(/:\s*([\w\d]+)/g, ': "$1"'))
}
function App() {
    const canvasRef = useRef(null);
  const [gameId, setGameId] = useState("");
  const [myCards, setMyCards] = useState([]);
  const [makerCards,setMakerCards] = useState([]);
  const [isGameEnd, setIsGameEnd] = useState(false);
  const [stand, SetStand] = useState(null);
  const [gameState, setGameState] = useState(null);


  useEffect(() => {
    const nodeConnection = new AleoNetworkClient("http://192.168.200.25:3030");

    let stage = new createjs.Stage(canvasRef.current);
		var mask = {
		maskDom: document.getElementById('mask'),
		maskMsgDome: document.getElementById('mask_msg'),
		copyDome: document.getElementById('copy'),
		closeDome: document.getElementById('mask_close'),
		show(msg) { 
			this.maskDom.style.display = 'block';
			this.maskMsgDome.innerText = msg;
		},

		async close(type) { 
			if (type === 'copy') { 
					await navigator.clipboard.writeText(this.maskMsgDome.innerText)
            }
            this.maskDom.style.display = 'none';
            this.maskMsgDome.innerText = '';	
			
		},
		mask_init() { 
			this.copyDome.addEventListener('click', ()=>this.close('copy'))
			this.closeDome.addEventListener('click', () =>this.close('close'))
		},
	
		cancelLister() { 
			this.copyDome.removeEventListener('click', this.close('copy'));
			this.closeDome.removeEventListener('click',this.close('close'));

		}
		}

	var game = {
    deck: [],
		chipsValue: {
			blue: 500,
			black: 100,
			green: 25,
			red: 5,
			white: 1
		},
		startContainer: undefined,
		buttons: [
			new Button('Hit', '#fff', 100, 100, () => player.hit()),
			new Button('Stand', '#fff', 200, 100, () => player.stand()),
			new Button('Go', '#fff', 935, -430, () => game.go()),
			//new Button('Insurance', '#fff', 100, -80, () => player.insure()),
			//new Button('Split', '#fff', 100, -40, () => l('split')),
			// new Button('Double', '#fff', 100, -40, () => player.double()),
			//new Button('Give up', '#fff', 100, 0, () => player.giveUp()),
			new Button('New game', '#fff', 100, -490, () => game.reset())
		],
		buttonContainer: undefined,
		dealtChipContainer: undefined,
		inProgress: false,
		dealt: {
			blue: 0,
			black: 0,
			green: 0,
			red: 0,
			white: 0
		},
		resetChips: function(){
			Object.keys(this.dealt).forEach(color => this.dealt[color] = 0);
		},
		message: {
			text: false,
			init: function(){
				this.text = new createjs.Text(messages.bet, '40px Arial', '#fff');
				this.text.x = 850;
				this.text.y = 0;
				stage.addChild(this.text);
			}
		},

		_alert: function(msg){
			var alertText = new createjs.Text(msg.msg, '30px Arial', 'orange');
			alertText.x = msg.x || 745;
			alertText.y = 120;
			stage.addChild(alertText);
			createjs.Tween.get(alertText)
				.wait(1000)
				.to({alpha: 0}, 1000, createjs.Ease.getPowInOut(1));
		},

		reset: function(){
			['userName', 'chips', 'funds'].forEach(v => localStorage.removeItem('BlackJackJs-' + v));
			location.reload();
		},

		over: function(){
			['userName', 'chips', 'funds'].forEach(v => localStorage.removeItem('BlackJackJs-' + v));
			stage.removeAllChildren();
			var gameOverText = new createjs.Text('Game Over', '50px Arial', '#fff');
			gameOverText.center(1, 1);
			var replayText = new createjs.Text('Replay', '30px Arial', '#fff');
			replayText.center(1);
			replayText.y = 400;
			var hit = new createjs.Shape();
			hit.graphics.beginFill("#000").drawRect(0, 0, replayText.getMeasuredWidth(), replayText.getMeasuredHeight());
			replayText.hitArea = hit;
			replayText.alpha = 0.7;
			replayText.cursor = 'Pointer';
			replayText.on('mouseover', function(){
                replayText.alpha = 1;
			});
			replayText.on('mouseout', () => replayText.alpha = 0.7);
			replayText.addEventListener('click', () => location.reload());
			stage.addChild(gameOverText, replayText);
		},

		balanceChips: function(value){
			var chips = {
				blue: 0,
				black: 0,
				green: 0,
				red: 0,
				white: 0
			};

			while(value !== 0){
				Object.keys(chips).reverse().forEach(function(chip){
					if(value >= game.chipsValue[chip]){
						value -= game.chipsValue[chip];
						chips[chip]++;
					}
				});
			}

			return chips;
		},

		startScreen: function(){
			stage.enableMouseOver(10);
			createjs.Ticker.addEventListener('tick', tick);
			createjs.Ticker.setFPS(60);
			createjs.Sound.registerSound('src/assets/sounds/sfx_lose.ogg', 'lose');
			createjs.Sound.registerSound('src/assets/sounds/sfx_shieldUp.ogg', 'win');
			createjs.Sound.registerSound('src/assets/Bonus/cardPlace1.ogg', 'card');
			createjs.Sound.registerSound('src/assets/Bonus/chipsCollide1.ogg', 'chip');
      		if (localStorage.getItem('BlackJackJs-userName')) {
				player.account_key = localStorage.getItem('BlackJackJs-key');
		  		record_state.account = new Account({ privateKey: player.account_key });
				player.name.value = localStorage.getItem('BlackJackJs-userName');
				player.funds = localStorage.getItem('BlackJackJs-funds');
				player.chips = JSON.parse(localStorage.getItem('BlackJackJs-chips'));
				this.start();
			}
			else{
				this.startContainer = new createjs.Container();
				var titleText = new createjs.Text('BlackJackJs', '60px Arial', '#fff');
				titleText.center(1, 1);
				var nameInput = new TextInput();
				// autofocus
				nameInput._focused = true;
				nameInput._hiddenInput.style.display = 'block';
				nameInput._hiddenInput.style.left = (nameInput.x + stage.canvas.offsetLeft + nameInput._padding) + 'px';
				nameInput._hiddenInput.style.top = (nameInput.y + stage.canvas.offsetTop + nameInput._padding) + 'px';
				nameInput._hiddenInput.focus();
				nameInput.x = 430;
				nameInput.y = 400;
				nameInput._visiblePostCursorText.text = 'Your Account';
				var submitText = new createjs.Text('OK', '30px Arial', '#fff');
				submitText.x = 640;
				submitText.y = 405;
				submitText.cursor = 'Pointer';
				var hit = new createjs.Shape();
				hit.graphics.beginFill('#000').drawRect(0, 0, submitText.getMeasuredWidth(), submitText.getMeasuredHeight());
				submitText.hitArea = hit;
				submitText.addEventListener('click', function(){
					player.name.value = nameInput._visiblePreCursorText.text || 'Player 1';
          player.account_key = nameInput._visibleText || '';
          record_state.account = new Account({ privateKey: player.account_key });
          localStorage.setItem('BlackJackJs-userName', player.name.value);
          localStorage.setItem('BlackJackJs-key', player.account_key);

					localStorage.setItem('BlackJackJs-funds', '1000');
          localStorage.setItem('BlackJackJs-chips', JSON.stringify(player.chips));
         // game.game_init();
					game.start();
				});
				this.startContainer.addChild(titleText, nameInput, submitText);
				stage.addChild(this.startContainer);
			}
		},

  

		start: function () {
			const player_name = player.name.value;
			player.name.text = new createjs.Text(player_name, '30px Arial', '#fff');
			player.name.text.center();
			player.name.text.y = 600;
			stage.addChild(player.name.text);
			if(this.startContainer)
			this.startContainer.removeAllChildren();
			this.message.init();
		//	player.fundsText.init();
		//	this.buildDeck();
			this.addButtons();
			//this.addChips();
		},
		

		go: function () {
			if(player.dealt && !this.inProgress){
				game.inProgress = true;
				player.betted = true;
        this.message.text.text = '';
        //todo 
        mask.show(`./target/release/snarkos developer execute --private-key ${player.account_key} --broadcast "http://127.0.0.1:3030/testnet3/transaction/broadcast" --query "http://127.0.0.1:3030"  zkgaming_blackjack1.aleo request_start`);
        mask.mask_init();
      	//game.init_test();
       record_state.game_init();
			//	this.new();
			}
			else if(!player.dealt)
				game._alert(messages.warning.bet);
		},

		init_test() { 
			const catd_value = [];
			const player_first = {
				mainer: 'player',
				hidden: false,
				value: 2,
			};
			for (let i = 0; i < 4; i++) { 
				catd_value.push({
						  mainer: i < 2 ? 'player':'bank',
						  hidden:i === 2,
                        value:i*3 + 1,
                      
				})
			}
			  game.new(player_first,catd_value)
		},

		end: function(){
			game.dealtChipContainer?.removeAllChildren();
			game.inProgress = false;
			player.betted = false;
			player.insurance = false;
			player.doubled = false;
			player.deck = [];
			player.blackjack = false;
			bank.blackjack = false;
			bank.deck = [];
			player.dealt = 2;
			player.chips = game.balanceChips(player.funds);
			game.resetChips();
			game.addChips();
			player.store();
			bank.cardsContainer.removeAllChildren();
			player.cardsContainer.removeAllChildren();
			this.message.text.text = messages.bet;
		},

		new: function (first,card_value) {
		this.distributeCard('player',undefined,first.value);
      	bank.cardsContainer.x = player.cardsContainer.x = 450;
        for (let i = 0; i < card_value.length; i++) { 
			setTimeout(() => {
			 const item = card_value[i];
              this.distributeCard(item.mainer,item.hidden,item.value);
           },750+ 750*i)

        
      }
			// setTimeout(function(){
			// 	game.distributeCard('player',undefined,5);
			// 	setTimeout(function(){
			// 		game.distributeCard('bank',undefined,6);
			// 		setTimeout(function(){
			// 			game.distributeCard('bank', true,undefined,10);
			// 		}, 750);
			// 	}, 750);
			// }, 750);
    },
   

		winDeck() { },


		buildDeck: function(){
			// for(let i=0; i<deckNumber; i++){
			// 	for(var suit of suits){
			// 		for(let i=2; i<11; i++)
			// 			this.deck.push(new Card(suit, i));

			// 		for(let v of ['J', 'Q', 'K', 'A'])
			// 			this.deck.push(new Card(suit, v));
			// 	}
			// }
				for(var suit of suits){
					for(let i=2; i<11; i++)
						this.deck.push(new Card(suit, i));
					for(let v of ['J', 'Q', 'K', 'A'])
						this.deck.push(new Card(suit, v));
				}
			console.log('====344',this.deck,suits)
		},

		deckValue: function(deck){
			var total = 0;
			deck.forEach(function(card){
				if(card.value >= 2 && card.value < 11)
					total += card.value;
				if(['J', 'Q', 'K'].includes(card.value))
					total += 10;
				if(card.value === 'A')
					total += 11;
			});

			return total;
		},

		distributeCard: function (to, hidden = false, value) {
			const number = value ? decodeNum(value) : {
				value: undefined,
				value_unit:undefined
			}
			var card = {
				value: number?.value,
				suit: suits_num(number?.value_unit),
				hidden: false
			};

			
			if(hidden) card.hidden = true;

			if(to === 'bank')
				bank.deck.push(card);
			else if(to === 'player')
				player.deck.push(card);
			// this.deck.splice(index, 1);
			this.displayCard(card, to);
		},

		displayCard: function (card, owner) {
			console.log('----34546',card, owner)
			if(!bank.cardsContainer){
				bank.cardsContainer = new createjs.Container();
				bank.cardsContainer.y = -100;
				stage.addChild(bank.cardsContainer);
				bank.cardsContainer.x = 450;
			}
			if(!player.cardsContainer){
				player.cardsContainer = new createjs.Container();
				player.cardsContainer.y = 300;
				stage.addChild(player.cardsContainer);
				player.cardsContainer.x = 450;
			}

			createjs.Sound.play('card');
			var card1 = new createjs.Bitmap(card.hidden ? imgs.cards.path + imgs.cards.back.red + '.' + imgs.cards.ext : imgs.cards.get(card.suit, card.value));

			if(owner === 'bank'){
				card1.x = 0;
				card1.y = -100;
				bank.cardsContainer.addChild(card1);
				createjs.Tween.get(card1)
					.to({x: 50 * bank.deck.length, y: 100}, 750, createjs.Ease.getPowInOut(1));
				bank.cardsContainer.x -= 20;
			}
			else if(owner === 'player'){
				card1.x = 100;
				card1.y = -400;
				player.cardsContainer.addChild(card1);
				createjs.Tween.get(card1).to({x: 50 * player.deck.length, y: 100}, 750, createjs.Ease.getPowInOut(1));
				player.cardsContainer.x -= 20;
				
			}

		},

		addButtons: function(){
			this.buttonContainer = new createjs.Container();
			this.buttonContainer.x = -70;
			this.buttonContainer.y = 500;
			stage.addChild(this.buttonContainer);

			this.buttons.forEach(function(b){
				var button = new createjs.Text(b.text, '30px Arial', b.color);
				button.x = b.x;
				button.y = b.y;
				var hit = new createjs.Shape();
				hit.graphics.beginFill('#000').drawRect(0, 0, button.getMeasuredWidth(), button.getMeasuredHeight());
				button.hitArea = hit;
				button.alpha = 0.7;
				button.on('mouseover', function(){
					button.alpha = 1;
					button.cursor = 'Pointer';
				});
				button.on('mouseout', () => button.alpha = 0.7);
				button.addEventListener('click', b.onclick);
				game.buttonContainer.addChild(button);
			});
		},

		addChips: function () {
			if(!player.chipsContainer){
				player.chipsContainer = new createjs.Container();
				player.chipsContainer.x = 600;
				player.chipsContainer.y = 500;

				game.dealtChipContainer = new createjs.Container();
				stage.addChild(player.chipsContainer, game.dealtChipContainer);
			}
			else
				player.chipsContainer.removeAllChildren();

			var base = {x: 100, y: 45};
			for(var chip in player.chips){
				for(let i=0; i<player.chips[chip]; i++){
					var chipImg = new createjs.Bitmap(imgs.chips.get(chip, 'side'));
					chipImg.x = base.x;
					chipImg.y = base.y;
					chipImg.color = chip;
					chipImg.dealt = false;
					//chipImg.shadow = new createjs.Shadow("#000000", 3, 3, 5); //too laggy :/
					player.chipsContainer.addChild(chipImg);
					base.y -= 10;
					if(i === player.chips[chip] - 1){ //add click event on top chip
						chipImg.cursor = 'Pointer';
						chipImg.on('mouseover', function(event){
							event.currentTarget.scaleX = 1.1;
							event.currentTarget.scaleY = 1.1;
							event.currentTarget.y -= 8;
						});
						chipImg.on('mouseout', function(event){
							event.currentTarget.scaleX = 1;
							event.currentTarget.scaleY = 1;
							event.currentTarget.y += 8;
						});
						chipImg.addEventListener('click', event => game.throwChip(event.currentTarget));
					}
				}
				base.y = 45;
				base.x += 75;
			}
		},

		throwChip: function(chip){
			if(chip.dealt || game.inProgress) return;
			chip.dealt = true;
			//remove chip from player.chipsContainer and add it to another container
			createjs.Sound.play('chip');
			player.chipsContainer.removeChildAt(player.chipsContainer.getChildIndex(chip));
			chip.x = chip.x + player.chipsContainer.x;
			chip.y = chip.y + player.chipsContainer.y;
			game.dealtChipContainer.addChild(chip);
			createjs.Tween.get(chip)
				.to({x: rand(350, 675) , y: rand(190, 350)}, 750, createjs.Ease.getPowInOut(1));
			var color = chip.color;
			player.dealt += this.chipsValue[color]; //add chip value to player.dealt
			player.chips[color] -= 1; //Reduce player chips number
			player.funds -= game.chipsValue[color];
			player.fundsText.update();
			game.dealt[color] += 1;
			this.addChips();
		},

		check: function(){
			var bankScore = this.deckValue(bank.deck);
			var playerScore = this.deckValue(player.deck);

			if(bankScore === 21 && bank.deck.length === 2)
				bank.blackjack = true;
			if(playerScore === 21 && player.deck.length === 2)
				player.blackjack = true;

			if(bank.blackjack && player.blackjack)
				return player.draw();
			else if(bank.blackjack)
				return player.lose();
			else if(player.blackjack)
				return player.win();

			if(bankScore > 21)
				player.win();
			else if(bankScore >= 17 && bankScore <= 21){
				if(playerScore > bankScore)
					player.win();
				else
					player.lose();
			}
		}

	};


	var bank = {

		deck: [],
		cardsContainer: undefined,
		blackJack: false,

		play: function(cardList,winer,nextIndex){
			if(player.doubled && player.deck.length > 2)
				player.cardsContainer.children[2].image.src = imgs.cards.get(player.deck[2].suit, player.deck[2].value);

			if(this.deck.length === 2)
				this.cardsContainer.children[1].image.src = imgs.cards.get(this.deck[1].suit, this.deck[1].value);

			var total = game.deckValue(this.deck);
			if (total < 17) {
				// 依次给牌
				const item_card_value = cardList[nextIndex]
				game.distributeCard('bank',undefined,item_card_value.toString());
				if(game.deckValue(this.deck) < 17)
					setTimeout(() => bank.play(
						cardList,winer,nextIndex+1
					), 1000);
				else
					game.check();
			}
			else
				game.check();
		},

	};

	var player = {
		deck: [],
		name: {
			value: 'Player 1',
			text: false,
		},
		account_key:'',
		cardsContainer: undefined,
		chipsContainer: undefined,
		blackjack: false,
		insurance: false,
		doubled: false,
		funds: 1000,
		fundsText: {
			text: false,
			init: function(){
				this.text = new createjs.Text(player.funds, '30px Arial', '#fff');
				this.text.x = 880;
				this.text.y = 590;
				stage.addChild(this.text);
			},
			update: function(){
				this.text.text = player.funds;
			}
		},
		betted: false,
		dealt: 2,
		chips: game.balanceChips(1000),

    	hit: function () {
			mask.show(`./target/release/snarkos developer execute --private-key ${player.account_key} --broadcast "http://127.0.0.1:3030/testnet3/transaction/broadcast" --query "http://127.0.0.1:3030" zkgaming_blackjack1.aleo request_hit`);
			mask.mask_init();
		
		},
		
		hit_card: function (card, isEnd) { 
			this.betted = isEnd;
			if(this.betted){
				game.distributeCard(card.mainer,card.hidden,card.value);
			}
			else
				game._alert(messages.warning.bet);
		},

		stand_card: function (cardList, winer, nextIndex) { 
			if(!this.betted)
			return game._alert(messages.warning.bet);
			game.inProgress = true;
			bank.play(cardList,winer,nextIndex);
		},

		stand: function () {
			mask.show(`./target/release/snarkos developer execute --private-key ${player.account_key} --broadcast "http://127.0.0.1:3030/testnet3/transaction/broadcast" --query "http://127.0.0.1:3030" zkgaming_blackjack1.aleo request_stand`);
			mask.mask_init();
			
		},

		insure: function(){
			if(game.inProgress && bank.deck.length === 2 && bank.deck[0].value === 'A'){
				this.insurance = Math.round(this.dealt / 2);
				this.funds -= this.insurance;
				this.chips = game.balanceChips(this.funds);
				this.fundsText.update();
				game._alert(messages.warning.insured);
			}
			else
				game._alert(messages.warning.insurance);
		},

		double: function(){
			if(game.inProgress && this.deck.length === 2 && !this.doubled){
				if(this.funds >= this.dealt){
					game._alert(messages.warning.doubled);
					this.doubled = true;
					this.funds -= this.dealt;
					this.dealt *= 2;
					this.chips = game.balanceChips(this.funds);
					this.store();
					game.addChips();
					for(var chip in game.dealt){
						//update graphic dealtcontainer
						for(let i=0; i<game.dealt[chip]; i++){
							var chipImg = new createjs.Bitmap(imgs.chips.get(chip, 'side'));
							chipImg.x = rand(350, 675);
							chipImg.y = rand(190, 350);
							chipImg.color = chip;
							chipImg.dealt = true;
							game.dealtChipContainer.addChild(chipImg);
						}
					}
					// eslint-disable-next-line no-redeclare
					for(var chip in game.dealt)
						if(game.dealt[chip])
							game.dealt[chip] *= 2;
					player.fundsText.update();
				}
				else
					game._alert(messages.warning.funds);
			}
			else
				game._alert(messages.warning.double);
		},

		giveUp: function(){
			if(game.inProgress && this.deck.length === 2 && bank.deck.length === 2){
				game._alert(messages.warning.gaveUp);
				this.funds += Math.round(this.dealt / 2);
				this.chips = game.balanceChips(this.funds);
				this.fundsText.update();
				player.store();
				game.addChips();
				game.end();
			}
			else
				game._alert(messages.warning.giveUp);
		},

		win: function(){
			game.message.text.text = messages.win;
			setTimeout(function(){
				createjs.Sound.play('win');
				player.funds += player.blackjack ? player.dealt * 3 : player.dealt * 2;
				game.end();
				player.fundsText.update();
			}, 2000);
		},

		lose: function(){
			game.message.text.text = messages.lose;
			if(this.doubled && this.deck.length === 3)
				this.cardsContainer.children[2].image.src = imgs.cards.get(this.deck[2].suit, this.deck[2].value);
			setTimeout(function(){
				createjs.Sound.play('lose');
				if(bank.blackjack && player.insurance){
					player.funds += player.insurance * 2;
					player.chips = game.balanceChips(player.funds);
					player.fundsText.update();
				}
				if(player.funds <= 0)
					return game.over();
				game.end();
			}, 2000);
		},

		draw: function(){
			game.message.text.text = messages.draw;
			setTimeout(function(){
				if(bank.blackjack && player.insurance){
					player.funds += player.insurance * 2;
					player.chips = game.balanceChips(player.funds);
					player.fundsText.update();
				}
				game.end();
				player.funds += player.dealt;
				player.fundsText.update();
			}, 2000);
		},

		store: function(){
			localStorage.setItem('BlackJackJs-funds', this.funds);
			localStorage.setItem('BlackJackJs-chips', JSON.stringify(this.chips));
		},

	};

  var record_state = {
    gameId: '',
    account: undefined,
   game_init: async function () { 
      let currentHeight = 4628;
      while (true) {
      let latestBlock = (await nodeConnection.getLatestBlock().catch(err => {
        console.log(err);
      }))
      console.log(latestBlock.header.metadata.height)
      if (currentHeight >= latestBlock.header.metadata.height) {
        continue;
      }
      currentHeight += 1;
      
      let currentBlock = (await nodeConnection.getBlock(currentHeight).catch(err => {
        console.log(err);
      }));
		  console.log("Syncing block", currentBlock?.header?.metadata?.height);
		  if (latestBlock.header.metadata.height - currentHeight > 5) {
			continue;
		  }
		  
      currentBlock?.transactions?.forEach(transaction => {
        if (transaction.type === "execute") {
          transaction.execution.transitions.forEach((transition) => {
            if (transition.function === "exchange") {
              // 解析 process_start_request 获取 用户 值
              let recordCiphertext = RecordCiphertext.fromString(transition.outputs[1].value)
              if (recordCiphertext.isOwner(this.account.viewKey())) {
                let recordPlaintext = recordCiphertext.decrypt(this.account.viewKey())
                let exchange = parsedNoNormalJsonString(recordPlaintext.toString())
                if (exchange.owner === this.account.toString() ) {
                  //设置游戏ID
					this.gameId = exchange.id;
					console.log('=====45645665-currentHeight--',currentHeight)
					mask.show(`./target/release/snarkos developer execute --private-key ${player.account_key} --broadcast "http://127.0.0.1:3030/testnet3/transaction/broadcast" --query "http://127.0.0.1:3030" zkgaming_blackjack1.aleo set_part2_nonce   "${recordPlaintext.toString()}" ${parseInt(Math.random()*1000+ 1000)}u64`)
                    mask.mask_init();
					//setGameId(exchange.id)
                }
              }
            }
            if (transition.function === "start_game") {
              // const outSting = transition.outputs[3].value.replace(/(\w+)\s*:/g, '"$1":').replace(/:\s*([\w\d]+)/g, ': "$1"')
              let out = parsedNoNormalJsonString(transition.outputs[3].value)
              console.log(out, record_state.account.toString())
              if (out.player ===record_state.account.toString() && out.game_id ===  this.gameId) {
				  let card_value = [];
				  let player_first = {};
				  transition.outputs.forEach((value, index) => {
					  if (index === 0) { 
						card_value.push({
						  mainer: 'bank',
						  hidden:true,
                      })
					  }
					  if (index !== 0) { 
					const marker_card = parsedNoNormalJsonString(value.value);
					if (index === 2) {
						player_first = {
							mainer: 'player',
							hidden:false,
							value: marker_card.point.replace(/\u128/g,''),
						}
					} else { 
						 card_value.push({
						  mainer: index >1 ? 'player':'bank',
						  hidden:false,
                        value:marker_card.point.replace(/\u128/g,''),
                      })
					}
					  }
					
					
                })
                game.new(player_first,card_value)
              }        
            }
  
            if (transition.function === "process_hit_request") {
				let out = parsedNoNormalJsonString(transition.outputs[1].value)
				console.log('-out--process_hit_request',out)
              if (out.player === record_state.account.toString() && out.game_id === this.gameId) {
				  let isEnd = transition.outputs[2].value
				  const my_card = out;
				  console.log('====out==44',out)
				  player.hit_card({
							mainer: 'player',
							hidden:false,
							value: my_card.point.replace(/\u128/g,''),
						},isEnd)
                // setMyCards(parsedNoNormalJsonString(out))
                // setIsGameEnd(Boolean(isEnd))
              }
            }
  
			  if (transition.function === "process_stand_request") {
				console.log('-process_stand_request----3',transition.outputs,this.gameId)
				  if (transition.outputs[2].value === this.gameId) {
					  const obj = {
						  winner: transition.outputs[0].value,
							gameId:transition.outputs[2].value,
						  cards: transition.outputs[1]?.value?.replace('u128',''),
						  next: transition.outputs[3].value,
							
					  }
					const deck_list = decode(obj.cards);
					const next = obj.next.replace('u8', '');
					console.log('---44deck_list', deck_list,next)
					player.stand_card(deck_list, obj.winner, Number(next));
					console.log('---stand---',{
                
                })
                // SetStand({
                //   winner: transition.outputs[0].value,
                //   next: transition.outputs[3].value,
                //   gameId:transition.outputs[2].value,
                //   cards: transition.outputs[1].value
                // })
              }
            }
          })
        }
      });
    }
    },
  
  }

	function tick(){
		stage.update();
	}

	  game.startScreen();
	 // record_state.game_init()
   },[])


  async function log() {
    let account = new Account({ privateKey: "APrivateKey1zkpH6TQz2ksSEsBF4BqrL87gLrM6XhLBEZvNSWAWrd8DrCJ" });
    console.log(account)
    console.log(account.viewKey())
    console.log(account.toString())
    let nodeConnection = new AleoNetworkClient("http://192.168.200.25:3030");
    let currentHeight = 223;
    let currentBlock = (await nodeConnection.getBlock(currentHeight).catch(err => {
      console.log(err);
    }));
    console.log("Syncing block", currentBlock.header.metadata.height);
    currentBlock.transactions?.forEach(transaction => {
      if (transaction.type === "execute") {
        transaction.execution.transitions.forEach((transition) => {
          if (transition.function === "exchange") {
            // 解析 process_start_request 获取 用户 值
            let recordCiphertext = RecordCiphertext.fromString(transition.outputs[1].value)
            if (recordCiphertext.isOwner(account.viewKey())) {
              let recordPlaintext = recordCiphertext.decrypt(account.viewKey())
              let exchange = parsedNoNormalJsonString(recordPlaintext.toString())
              if (exchange.owner === account.toString()) {
                //设置游戏ID
                setGameId(exchange.id)
              }
            }
          }
          if (transition.function === "start_game") {
            // const outSting = transition.outputs[3].value.replace(/(\w+)\s*:/g, '"$1":').replace(/:\s*([\w\d]+)/g, ': "$1"')
            let out = parsedNoNormalJsonString(transition.outputs[3].value)
            console.log(out,account.toString())
            if (out.player === account.toString() && out.game_id === gameId) {
              transition.outputs.forEach((value,index) => {
                if (index > 0) {
                  if (index==1) {
                    setMakerCards(parsedNoNormalJsonString(value.value))
                  }
                  if (index>1) {
                    setMyCards(parsedNoNormalJsonString(value.value))
                  }
                }
              })
            }        
          }

          if (transition.function === "process_hit_request") {
           let out = parsedNoNormalJsonString(transition.outputs[1].value)
            if (out.player === account.toString() && out.game_id === gameId) {
              let isEnd = parsedNoNormalJsonString(transition.outputs[2].value)
              setMyCards(parsedNoNormalJsonString(out))
              setIsGameEnd(Boolean(isEnd))
            }
          }

          if (transition.function === "process_stand_request") {
            if (transition.outputs[2]=== gameId) {
              SetStand({
                winner: transition.outputs[0].value,
                next: transition.outputs[3].value,
                gameId:transition.outputs[2].value,
                cards: transition.outputs[1].value
              })
            }
          }
        })
      }
    });
  }

  // log()

  async function logs() {
    let nodeConnection = new AleoNetworkClient("http://192.168.200.25:3030");
    console.log(nodeConnection)
    let account = new Account({ privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" });
    let currentHeight = 100;
    while (true) {
      let latestBlock = (await nodeConnection.getLatestBlock().catch(err => {
        console.log(err);
      }))
      console.log(latestBlock.header.metadata.height)
      if (currentHeight >= latestBlock.header.metadata.height) {
        await sleep(1000 * 15);
        continue;
      }
      currentHeight += 1;
      
      let currentBlock = (await nodeConnection.getBlock(currentHeight).catch(err => {
        console.log(err);
      }));
      console.log("Syncing block", currentBlock.header.metadata.height);
      currentBlock.transactions?.forEach(transaction => {
        if (transaction.type === "execute") {
          transaction.execution.transitions.forEach((transition) => {
            if (transition.function === "exchange") {
              // 解析 process_start_request 获取 用户 值
              let recordCiphertext = RecordCiphertext.fromString(transition.outputs[1].value)
              if (recordCiphertext.isOwner(account.viewKey())) {
                let recordPlaintext = recordCiphertext.decrypt(account.viewKey())
                let exchange = parsedNoNormalJsonString(recordPlaintext.toString())
                if (exchange.owner === account.toString()) {
                  //设置游戏ID
                  setGameId(exchange.id)
                }
              }
            }
            if (transition.function === "start_game") {
              // const outSting = transition.outputs[3].value.replace(/(\w+)\s*:/g, '"$1":').replace(/:\s*([\w\d]+)/g, ': "$1"')
              let out = parsedNoNormalJsonString(transition.outputs[3].value)
              console.log(out,account.toString())
              if (out.player === account.toString() && out.game_id === gameId) {
                transition.outputs.forEach((value,index) => {
                  if (index > 0) {
                    if (index == 1) {
                      makerCards.push(parsedNoNormalJsonString(value.value))
                      //makerCards.point
                      setMakerCards(makerCards)
                    }
                    if (index>1) {
                      setMyCards(parsedNoNormalJsonString(value.value))
                    }
                  }
                })
              }        
            }
  
            if (transition.function === "process_hit_request") {
             let out = parsedNoNormalJsonString(transition.outputs[1].value)
              if (out.player === account.toString() && out.game_id === gameId) {
                let isEnd = parsedNoNormalJsonString(transition.outputs[2].value)
                setMyCards(parsedNoNormalJsonString(out))
                setIsGameEnd(Boolean(isEnd))
              }
            }
  
            if (transition.function === "process_stand_request") {
              if (transition.outputs[2]=== gameId) {
                SetStand({
                  winner: transition.outputs[0].value,
                  next: transition.outputs[3].value,
                  gameId:transition.outputs[2].value,
                  cards: transition.outputs[1].value
                })
              }
            }
          })
        }
      });
    }
  }
  
  // useEffect(() => {
  //   logs
  // },[])

  return (
  <>
        <canvas ref={canvasRef} width="1100" height="650"></canvas>
        <div id="mask">	
            <div className="mask_content">
                <div className="mask_content_header">
                    <span id="mask_close">X</span>
                </div>
                <div id="mask_msg">
                    AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw
                </div>
                <div className="mask_footer">
                    <span id="copy">copy</span>
                </div>
            </div>
        </div>
    </>
  )
}

export default App

