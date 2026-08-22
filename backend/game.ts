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
		maxHp: 2
    timePerTurn: 10000
	}
	lastChar = "";
	players: Player[] = [];
	turnIndex = 0;
	usedWords = new Set<string>();
	winner: Player | null = null;

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

    if (this.players[0]?.dead || this.players[0]?.afk) {
      this.nextTurn();
    }
	}

	gameEnd(){
		this.gameStatus = false;
	}

	getRandomWord(): string {
		return wordList[Math.floor(Math.random() * wordList.length)] || "";
	}

	// add player bisa untuk reconnect
	addPlayer({ id, name }: { id: string; name: string}): {success: boolean, message?: string}{
		const existing = this.players[turnIndex]?.id === id;
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
		return {success: true}
	}
	
	nextTurn(){
		const players = this.players;

		// check afk for first turn 
		if(this.turnIndex == 0){

			if(players[0]?.afk){
				this.turnIndex = (this.turnIndex + 1) % players.length;
			}

			return this.turnIndex;
		}

    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
      attempts++;
    } while (
      (this.players[this.turnIndex]?.dead || this.players[this.turnIndex]?.afk) && 
      attempts < this.players.length
    );

		return this.turnIndex;
	}

	submitAnswer(id: string, answer: string): {success: boolean, message?: string}{
    const player = this.players.find(p => p.id === id);
    const activePlayer = this.players[this.turnIndex];
    if(!player){
      return {success: false, message: "Player tidak valid"}
    }

    if(activePlayer.id !== id){
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
    const player = this.players.find(p => p.id === id);
    if(!player){
      return {success: false, message: "Player tidak valid"}
    }
    player.afk = true;
    const activePlayers = this.players.filter(p => !p.dead && !p.afk && p.id != id);
    if(activePlayers.length < 2){
      this.gameEnd();
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
		const minHp = Math.min(...activePlayers.map(p => p.hp));
		player.hp = minHp;
		player.afk = false;

		return {success: true};
	}
}
