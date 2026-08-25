import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useGameSocket, useTurnCountdown } from '../hooks/useGameSocket'

export const Route = createFileRoute('/')({ component: SambungKataApp })

function SambungKataApp() {
  const {
    gameState,
    playerId,
    errorMessage,
    joinGame,
    submitAnswer,
    toggleAfk,
  } = useGameSocket()

  const [playerNameInput, setPlayerNameInput] = useState('')
  const [wordInput, setWordInput] = useState('')

  const { timeLeft, percentage } = useTurnCountdown(
    gameState?.turnDeadline,
    gameState?.gameConfig?.timePerTurn || 10
  )

  const currentPlayer = gameState?.players.find((p) => p.id === playerId)
  const isJoined = Boolean(currentPlayer)
  const isMyTurn =
    Boolean(gameState?.gameStatus) &&
    gameState?.players[gameState.turnIndex]?.id === playerId
  const isDead = currentPlayer?.dead ?? false
  const isAfk = currentPlayer?.afk ?? false

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerNameInput.trim()) {
      joinGame(playerNameInput.trim())
    }
  }

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault()
    if (wordInput.trim()) {
      submitAnswer(wordInput.trim())
      setWordInput('')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-start antialiased selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md my-auto py-2">
        {/* App Header */}
        <header className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">◈</span>
              <span>Sambung Kata</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ID: <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{playerId.slice(0, 8)}</span>
              {currentPlayer && (
                <span className="ml-2 text-slate-300 font-sans">
                  | <strong className="text-white">{currentPlayer.name}</strong>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LAN Live</span>
          </div>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. JOIN SCREEN (If not joined yet) */}
        {!isJoined && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-black text-white tracking-tight mb-1">Masuk ke Permainan</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ketik nama panggilanmu untuk bergabung ke arena Sambung Kata.
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-3.5">
              <input
                type="text"
                placeholder="Masukkan nama kamu..."
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition"
                autoFocus
              />
              <button
                type="submit"
                disabled={!playerNameInput.trim()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-2xl transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                Gabung Room
              </button>
            </form>
          </section>
        )}

        {/* 2. LOBBY VIEW (When waiting for host to start) */}
        {!gameState?.gameStatus && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-200">
                Pemain di Room ({gameState?.players.length || 0})
              </h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                Lobby
              </span>
            </div>

            {/* Winner Announcement if previous game just ended */}
            {gameState?.winner && (
              <div className="mb-5 p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-center shadow-lg">
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-1">
                  Pemenang Ronde Sebelumnya
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {gameState.winner.name}
                </div>
              </div>
            )}

            <div className="space-y-2.5 mb-5">
              {gameState?.players && gameState.players.length > 0 ? (
                gameState.players.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      p.afk
                        ? 'bg-slate-950/40 border-slate-850 opacity-60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full text-xs font-black">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-100 text-sm">{p.name}</span>
                      {p.afk && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800/80 rounded-full">
                          AFK
                        </span>
                      )}
                    </div>
                    {p.id === playerId && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800/80 rounded-full">
                        Kamu
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">
                  Belum ada pemain yang bergabung.
                </p>
              )}
            </div>

            {isJoined && (
              <div className="border-t border-slate-800/80 pt-5 flex flex-col items-center gap-3.5">
                <p className="text-xs sm:text-sm text-slate-400 font-medium text-center">
                  Menunggu Host memulai game di layar utama...
                </p>

                {/* AFK Toggle in Lobby */}
                <button
                  onClick={toggleAfk}
                  className={`w-full py-3 px-4 rounded-2xl text-sm font-bold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isAfk
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80'
                  }`}
                >
                  {isAfk ? (
                    <span>Saya Siap</span>
                  ) : (
                    <span>Set Status AFK</span>
                  )}
                </button>
              </div>
            )}
          </section>
        )}

        {/* 3. ACTIVE GAME BOARD */}
        {gameState?.gameStatus && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm space-y-4">
            {/* Current Word Display */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-center shadow-inner">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                Kata Saat Ini (Kata ke-{gameState.usedWordsCount})
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-wider uppercase my-2.5">
                <span className="text-white">{gameState.currentWord.slice(0, -1)}</span>
                <span className="text-rose-400 underline decoration-4 underline-offset-4 bg-rose-950/80 px-1.5 py-0.5 rounded-lg border border-rose-800/60 ml-0.5">
                  {gameState.lastChar}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-semibold">
                Awalan berikutnya: <strong className="text-sm uppercase text-rose-300 font-black">"{gameState.lastChar}"</strong>
              </p>
            </div>

            {/* Turn Banner & Countdown */}
            <div
              className={`p-4 rounded-2xl text-center font-bold text-sm sm:text-base transition-all border ${
                isMyTurn
                  ? 'bg-amber-950/60 text-amber-200 border-amber-500/80 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-left font-black">
                  {isMyTurn ? (
                    <span className="text-amber-300">GILIRAN KAMU SEKARANG</span>
                  ) : (
                    <span>
                      Giliran:{' '}
                      <strong className="text-blue-400">
                        {gameState.players[gameState.turnIndex]?.name || '...'}
                      </strong>
                    </span>
                  )}
                </span>
                {timeLeft > 0 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide font-mono ${
                      timeLeft <= 3
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/50'
                        : isMyTurn
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {timeLeft}s
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    percentage <= 25
                      ? 'bg-rose-500 shadow-sm shadow-rose-500'
                      : percentage <= 50
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Input Form */}
            {isJoined && !isDead && (
              <form onSubmit={handleSubmitWord} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    isMyTurn
                      ? `Ketik kata berawalan "${gameState.lastChar}"...`
                      : 'Menunggu giliranmu...'
                  }
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  disabled={!isMyTurn}
                  maxLength={30}
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-950/40 disabled:text-slate-600 text-base transition"
                  autoFocus={isMyTurn}
                />
                <button
                  type="submit"
                  disabled={!isMyTurn || !wordInput.trim()}
                  className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-2xl transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                >
                  Kirim
                </button>
              </form>
            )}

            {/* Players Status List */}
            <div className="border-t border-slate-800/80 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Status Pemain:
              </h3>
              <div className="space-y-2">
                {gameState.players.map((p, idx) => {
                  const isCurrentTurn = idx === gameState.turnIndex
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        p.dead
                          ? 'bg-rose-950/20 border-rose-900/60 opacity-50'
                          : isCurrentTurn
                          ? 'bg-blue-950/70 border-2 border-blue-500 shadow-md shadow-blue-950'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{p.name}</span>
                        {p.id === playerId && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800/80 rounded-full font-semibold">
                            Kamu
                          </span>
                        )}
                        {p.dead && (
                          <span className="text-xs font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">GUGUR</span>
                        )}
                        {p.afk && (
                          <span className="text-xs font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">AFK</span>
                        )}
                      </div>
                      
                      {/* Clean HP Dots */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-400">HP</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: gameState.gameConfig?.maxHp || 2 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${
                                i < p.hp
                                  ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                                  : 'bg-slate-800 border border-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AFK Toggle */}
            {isJoined && !isDead && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={toggleAfk}
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer"
                >
                  {isAfk ? 'Kembali ke Game' : 'Mode AFK'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
