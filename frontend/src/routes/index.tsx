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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/* App Header */}
        <header className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              🎮 <span>Sambung Kata</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: <code className="bg-slate-200 px-1 py-0.5 rounded">{playerId.slice(0, 8)}</code>
              {currentPlayer && (
                <span className="ml-2 font-medium text-slate-700">
                  | Nama: <strong>{currentPlayer.name}</strong>
                </span>
              )}
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {!isJoined && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Masuk ke Permainan</h2>
            <p className="text-sm text-slate-500 mb-4">
              Masukkan nama panggilanmu untuk bergabung ke room.
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nama kamu..."
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
              <button
                type="submit"
                disabled={!playerNameInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gabung Room
              </button>
            </form>
          </section>
        )}

        {!gameState?.gameStatus && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Pemain di Room ({gameState?.players.length || 0})
              </h2>
            </div>

            {gameState?.winner && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-600 mb-1">
                  Pemenang Ronde Sebelumnya
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  🏆 {gameState.winner.name}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {gameState?.players && gameState.players.length > 0 ? (
                gameState.players.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      p.afk
                        ? 'bg-amber-50/60 border-amber-200 opacity-75'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      {p.afk && (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full">
                          AFK
                        </span>
                      )}
                    </div>
                    {p.id === playerId && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        Kamu
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada pemain yang bergabung.
                </p>
              )}
            </div>

            {isJoined && (
              <div className="border-t border-slate-100 pt-4 flex flex-col items-center gap-3">
                <p className="text-sm text-slate-600 font-medium animate-pulse">
                  ⏳ Menunggu Host memulai game di layar utama...
                </p>

                <button
                  onClick={toggleAfk}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    isAfk
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {isAfk ? (
                    <>
                      <span>🟢</span>
                      <span>Saya Siap! (Kembali dari AFK)</span>
                    </>
                  ) : (
                    <>
                      <span>💤</span>
                      <span>Set Status AFK</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        )}

        {gameState?.gameStatus && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4 space-y-4">
            {/* Current Word Display */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 text-center shadow-inner">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Kata Saat Ini (Kata ke-{gameState.usedWordsCount})
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-wider uppercase my-2">
                <span>{gameState.currentWord.slice(0, -1)}</span>
                <span className="text-red-400 underline decoration-4 underline-offset-4 bg-red-950/60 px-1 rounded">
                  {gameState.lastChar}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                Awalan berikutnya: <strong className="text-sm uppercase text-red-300 font-bold">"{gameState.lastChar}"</strong>
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl text-center font-bold text-sm sm:text-base transition-all ${
                isMyTurn
                  ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span>
                  {isMyTurn ? (
                    '👉 GILIRAN KAMU SEKARANG! 👈'
                  ) : (
                    <span>
                      Giliran:{' '}
                      <strong className="text-blue-600">
                        {gameState.players[gameState.turnIndex]?.name || '...'}
                      </strong>
                    </span>
                  )}
                </span>
                {timeLeft > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black tracking-wide ${
                      timeLeft <= 3
                        ? 'bg-red-600 text-white animate-pulse'
                        : isMyTurn
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-300 text-slate-800'
                    }`}
                  >
                    ⏱️ {timeLeft}s
                  </span>
                )}
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    percentage <= 25
                      ? 'bg-red-500'
                      : percentage <= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

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
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-base"
                  autoFocus={isMyTurn}
                />
                <button
                  type="submit"
                  disabled={!isMyTurn || !wordInput.trim()}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Kirim
                </button>
              </form>
            )}

            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Status Pemain:
              </h3>
              <div className="space-y-1.5">
                {gameState.players.map((p, idx) => {
                  const isCurrentTurn = idx === gameState.turnIndex
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition ${
                        p.dead
                          ? 'bg-rose-50 border border-rose-200 opacity-70'
                          : isCurrentTurn
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-xs'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                        {p.id === playerId && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                            Kamu
                          </span>
                        )}
                        {p.dead && (
                          <span className="text-xs font-bold text-rose-600">[GUGUR]</span>
                        )}
                        {p.afk && (
                          <span className="text-xs font-bold text-slate-400">[AFK]</span>
                        )}
                      </div>
                      <div className="text-base tracking-widest">
                        {'❤️'.repeat(p.hp)}
                        {'🖤'.repeat(Math.max(0, (gameState.gameConfig?.maxHp || 2) - p.hp))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {isJoined && !isDead && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={toggleAfk}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {isAfk ? '🟢 Kembali ke Game' : '💤 Mode AFK'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
