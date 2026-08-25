import { Game } from "./game";

interface WsData {
  playerId: string;
  name?: string;
}

const game = new Game();
const ROOM_TOPIC = "sambung-kata";

function broadcastState(server: any){
  server.publish( ROOM_TOPIC, JSON.stringify({
    type: "SYNC_STATE",
    data: game.getState(),
  }))
}

game.onStateChange = () => {
  broadcastState(server);
}

const server = Bun.serve<WsData>({
  port: 4000,
  hostname: "0.0.0.0",

  fetch(req, server) {
    const url = new URL(req.url);

    if(url.pathname === "/ws") {
      const playerId = url.searchParams.get("playerId") || crypto.randomUUID();
      const success = server.upgrade(req, {data: {playerId}});
      return success ? undefined : new Response("WebSocket upgrade failed", {status: 400});
    }

    return new Response("Sambung kata server is running. Connect via WebSocket at /ws", {status: 200});
  },

  websocket: {
    open(ws) {
      ws.subscribe(ROOM_TOPIC);
      console.log(`WebSocket connection opened: ${ws.data.playerId}`);

      ws.send(
        JSON.stringify({
          type: "SYNC_STATE",
          data: game.getState(),
          playerId: ws.data.playerId
        })
      )
    },

    message(ws, rawMessage) {
      try {
        const message = JSON.parse(rawMessage.toString());
        const { playerId } = ws.data;

        switch(message.type) {
          case "JOIN_GAME": {
            ws.data.name = message.name;
            const res = game.addPlayer({ id: playerId, name: message.name });

            if(!res.success){
              ws.send(JSON.stringify({
                type: "ERROR",
                message: res.message
              }));
            }

            broadcastState(server);
            break;
          }
          case "START_GAME": {
            const config = message.config || { maxHp: 2, turnTime: 10 };
            const res = game.startGame(config);

            if(res && !res.success){
              ws.send(JSON.stringify({
                type: "ERROR",
                message: res.message
              }));
            }

            broadcastState(server);
            break;
          }
          case "SUBMIT_ANSWER": {
            const answer = message.answer;
            const res = game.submitAnswer(playerId, answer);

            if(!res.success){
              ws.send(JSON.stringify({
                type: "ERROR",
                message: res.message
              }));
            }

            broadcastState(server);
            break;
          }
          case "TOGGLE_AFK": {
            const player = game.players.find(p => p.id === playerId);
            if(player) {
              if(player.afk) {
                game.returnFromAfk(playerId);
              } else {
                game.goAfk(playerId); 
              }

              broadcastState(server);
            }
            break
          }
        }
      } catch (err) {
        console.error("[WS] Error handling message: ", err);
      }
    },

    close(ws) {
      console.log(`[WS] Connection closed: ${ws.data.playerId}`);
      // tandai sebagai afk jika pemain disconnect
      game.goAfk(ws.data.playerId);
      broadcastState(server);
    }

  }
})

console.log(`Sambung Kata server is running on ws://${server.hostname}:${server.port} /ws`);


