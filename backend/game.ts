export interface Player{
	id: string;
	name: string;
	hp: number;
}

export class Game{
	currentWord = "mulai";
	gameStatus = false;
	lastChar = "i";
	players: Player[] = [];
	turnIndex = 0;
	usedWords = Set<string>(["mulai"]);

	// add player bisa untuk reconnect
	addPlayer({id, name}: Omit<Player, 'hp'>): {success: boolean, message?: string}{
		const gameRunning = this.gameStatus;
		if(gameRunning){
			return {success: false, message: "Game sedang berlangsung"}
		}

		const existing = this.players.find(p => p.id === id);
		if(existing){
			return {success: true}
		}

		const nameExist = this.players.find(p => p.name === name);
		if(nameExist){
			return {success: false, message: "Nama sudah digunakan oleh player lain"}
		}

		this.players.push({id, name, hp: 3});
		return {success: true}
	}
	
	nextTurn(){

	}

}
