export interface Player{
	id: string;
	name: string;
	hp: number;
	afk: boolean;
	dead: boolean;
}

export interface GameConfig{
	maxHp: 1|2|3;
  timePerTurn: number;
}

async function loadKbbiFile(): Promise<string[]>{
	const file = Bun.file('./kbbi.txt');
	const content = await file.text();
	const result: string[] = content
		.split(/\r?\n/)
		.map((w: string) => w.trim())
		.filter(Boolean); 
	return result;
}

const wordList: string[] = await loadKbbiFile();
export const kbbiSet = new Set<string>(wordList);

export class Game{
	currentWord = "";
	gameStatus = false;
	gameConfig: GameConfig = {
		maxHp: 2,
    timePerTurn: 10
	}
	lastChar = "";
	players: Player[] = [];
	turnIndex = 0;
	usedWords = new Set<string>();
	winner: Player | null = null;
	public onStateChange?: () => void;

	private turnTimer: ReturnType<typeof setTimeout> | null = null;
	private checkWinner(){
		const activePlayers = this.players.filter(p => !p.dead && !p.afk);
		if(activePlayers.length <= 1){
			this.winner = activePlayers[0] || null;
			this.gameEnd();
		}
	}

	getState(){
		return {
			gameStatus: this.gameStatus,
			currentWord: this.currentWord,
			lastChar: this.lastChar,
			players: this.players,
			turnIndex: this.turnIndex,
			activePlayer: this.players[this.turnIndex] || null,
			winner: this.winner,
			gameConfig: this.gameConfig,
			usedWordsCount: this.usedWords.size
		}
	}

	startGame(gameConfig: GameConfig){
		if(this.players.length < 2){
			return {success: false, message: "Harus ada minimal 2 player"}
		}

		const randomWord = this.getRandomWord()

		this.gameStatus = true;
		this.players.forEach(p => {
			p.hp = gameConfig.maxHp;
			p.dead = false;
		});
		this.gameConfig = gameConfig;
		this.turnIndex = 0;

		this.usedWords.clear();
		this.usedWords.add(randomWord);
		this.currentWord = randomWord;
		this.lastChar = randomWord.slice(-1);

		this.turnIndex = -1;
		this.nextTurn();
	}

	reduceHp(id: string){
		if(!this.gameStatus) return;
		
		const player = this.players.find(p => p.id == id);
		if(!player || player.dead || player.afk) return;

		player.hp--;

		if(player.hp <= 0){
			player.hp = 0;
			player.dead = true
			this.checkWinner();
		}

		if(this.gameStatus){
			this.nextTurn();
		}
	}

	gameEnd(){
		this.gameStatus = false;
		if(this.turnTimer){
			clearTimeout(this.turnTimer);
			this.turnTimer = null;
		}
		this.onStateChange?.();
	}

	getRandomWord(): string {
		return wordList[Math.floor(Math.random() * wordList.length)] || "";
	}

	// add player bisa untuk reconnect
	addPlayer({ id, name }: { id: string; name: string}): {success: boolean, message?: string}{
		const existing = this.players.find(p => p.id === id);
		if(existing){
			return {success: true}
		}

		const gameRunning = this.gameStatus;
		if(gameRunning){
			return {success: false, message: "Game sedang berlangsung"}
		}

		const nameExist = this.players.find(p => p.name === name);
		if(nameExist){
			return {success: false, message: "Nama sudah digunakan oleh player lain"}
		}

		this.players.push({id, name, hp: this.gameConfig.maxHp, afk: false, dead: false });
		this.onStateChange?.();
		return {success: true}
	}
	
	nextTurn(){
		if(this.turnTimer){
			clearTimeout(this.turnTimer);
			this.turnTimer = null;
		}

		let attempts = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
			attempts++;
    } while (
			(this.players[this.turnIndex]?.dead || this.players[this.turnIndex]?.afk) &&
			attempts < this.players.length
		);

		if(attempts >= this.players.length) {
			this.onStateChange?.();
			return this.turnIndex;
		}

		const currentPlayer = this.players[this.turnIndex];
		if(currentPlayer && !currentPlayer?.afk && !currentPlayer?.dead){
			this.turnTimer = setTimeout(() => {
				this.reduceHp(currentPlayer?.id);
			}, this.gameConfig.timePerTurn * 1000)
		}

		this.onStateChange?.();
		return this.turnIndex;
	}

	submitAnswer(id: string, answer: string): {success: boolean, message?: string}{
		if(!this.gameStatus){
			return {success: false, message: "Tidak bisa mengirim jawaban saat ini"}
		}

    const player = this.players.find(p => p.id === id);
    const activePlayer = this.players[this.turnIndex];
    if(!player){
      return {success: false, message: "Player tidak valid"}
    }

    if(!activePlayer || activePlayer.id !== id){
      return {success: false, message: "Bukan giliranmu"}
    }

		const userWord = answer.toLowerCase();
		const isValid = kbbiSet.has(userWord);
		const isMatchingLastChar = userWord.slice(0, 1) === this.lastChar;
		const isUsed = this.usedWords.has(userWord);

		if(!isValid){
			return {success: false, message: "Kata tidak ada dalam kbbi"}
		}
		if(!isMatchingLastChar){ 
			return {success: false, message: "Kata tidak cocok dengan huruf terakhir"}
		}
		if(isUsed){
			return {success: false, message: "Kata sudah digunakan"}
		}
		
		this.usedWords.add(userWord);
		this.currentWord = userWord;
		this.lastChar = userWord.slice(-1);

		this.nextTurn();

		return {success: true};
	}

  goAfk(id: string): {success: boolean, message?: string}{
    const playerIndex = this.players.findIndex(p => p.id === id);

    if(playerIndex === -1){
      return {success: false, message: "Player tidak valid"}
    }

		const currentPlayer = this.players[playerIndex];
		if(!currentPlayer){
			return {success: false, message: "Player tidak valid"}
		}

		currentPlayer.afk = true;
		this.checkWinner();

		if(this.gameStatus && this.turnIndex === playerIndex){
			this.nextTurn()
		} else {
			this.onStateChange?.();
		}

    return {success: true};
  }

	// jika player afk kembali, maka pinaltinya adalah hp berkurang menyesuaikan hp player aktif yang memiliki hp paling rendah.
	returnFromAfk(id: string): {success: boolean, message?: string}{
		const player = this.players.find(p => p.id === id);
		if(!player){
			return {success: false, message: "Player tidak ada"}
		}

		const activePlayers = this.players.filter(p => !p.dead && !p.afk && p.id != id);
		const minHp = activePlayers.length > 0 ? Math.min(...activePlayers.map((p) => p.hp)) : 1;
		player.hp = minHp;
		player.afk = false;

		this.onStateChange?.();
		return {success: true};
	}
}
