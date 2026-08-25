import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useGameSocket, useTurnCountdown, type GameConfig } from '../hooks/useGameSocket'
import { sounds } from '../utils/audio'

export const Route = createFileRoute('/display')({ component: HostDisplayApp })

function HostDisplayApp() {
  const { gameState, startGame, endGame } = useGameSocket()

  const { timeLeft, percentage } = useTurnCountdown(
    gameState?.turnDeadline,
    gameState?.gameConfig?.timePerTurn || 10
  )

  const [isMuted, setIsMuted] = useState(false)
  const [soundFeedback, setSoundFeedback] = useState<string | null>(null)
  const [config, setConfig] = useState<GameConfig>({
    maxHp: 2,
    timePerTurn: 10,
  })

  const prevGameStatusRef = useRef<boolean>(false)
  const prevWordRef = useRef<string>('')
  const prevTotalHpRef = useRef<number>(0)
  const prevWinnerRef = useRef<string | null>(null)

  useEffect(() => {
    if (!gameState) return

    const totalHp = gameState.players.reduce((sum, p) => sum + p.hp, 0)
    const currentWord = gameState.currentWord
    const isGameRunning = gameState.gameStatus
    const winnerId = gameState.winner?.id || null

    // 1. Game Started
    if (isGameRunning && !prevGameStatusRef.current) {
      sounds.playStart()
      triggerVisualFeedback('🚀 GAME DIMULAI!')
    }
    else if (winnerId && winnerId !== prevWinnerRef.current) {
      sounds.playWin()
      triggerVisualFeedback(`🏆 PEMENANG: ${gameState.winner?.name}!`)
    }
    else if (
      isGameRunning &&
      prevGameStatusRef.current &&
      totalHp < prevTotalHpRef.current
    ) {
      sounds.playWrong()
      triggerVisualFeedback('❌ TETOTT! (Waktu Habis / HP Berkurang)')
    }
    else if (
      isGameRunning &&
      prevGameStatusRef.current &&
      currentWord &&
      currentWord !== prevWordRef.current
    ) {
      sounds.playCorrect()
      triggerVisualFeedback('🔔 TINUNG! (Jawaban Benar)')
    }

    prevGameStatusRef.current = isGameRunning
    prevWordRef.current = currentWord
    prevTotalHpRef.current = totalHp
    prevWinnerRef.current = winnerId
  }, [gameState])

  const triggerVisualFeedback = (text: string) => {
    setSoundFeedback(text)
    setTimeout(() => setSoundFeedback(null), 2500)
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    sounds.setMuted(next)
  }

  const handleManualEndGame = () => {
    if (window.confirm('Yakin ingin mengakhiri permainan sekarang secara manual?')) {
      endGame()
      triggerVisualFeedback('⏹️ GAME DIAKHIRI OLEH HOST')
    }
  }

  const hostIp = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 sm:p-8 flex flex-col justify-between">
      <header className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 text-slate-100">
              📺 <span>SAMBUNG KATA</span>
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
              HOST DISPLAY
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            📱 Pemain buka browser di HP: <strong className="text-blue-400 font-bold underline">http://{hostIp}:3000</strong>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {gameState?.gameStatus && (
            <button
              onClick={handleManualEndGame}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-1.5 border border-rose-500 animate-pulse mr-2"
            >
              ⏹️ <span>Akhiri Game</span>
            </button>
          )}

          <button
            onClick={() => sounds.playCorrect()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            🔔 <span>Test Tinung</span>
          </button>
          <button
            onClick={() => sounds.playWrong()}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            ❌ <span>Test Tetott</span>
          </button>
          <button
            onClick={toggleMute}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 ${
              isMuted ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isMuted ? '🔇 Unmute' : '🔊 Mute Audio'}
          </button>
        </div>
      </header>

      {soundFeedback && (
        <div
          className={`text-center py-3 px-6 my-4 font-black text-lg sm:text-xl rounded-2xl shadow-lg animate-bounce transition-all ${
            soundFeedback.includes('TINUNG')
              ? 'bg-emerald-600 text-white shadow-emerald-500/30'
              : soundFeedback.includes('TETOTT')
              ? 'bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-amber-500 text-slate-950 shadow-amber-500/30'
          }`}
        >
          {soundFeedback}
        </div>
      )}

      {!gameState?.gameStatus && (
        <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-8 text-center">
          {/* Winner Banner */}
          {gameState?.winner && (
            <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-3xl p-8 mb-8 shadow-2xl shadow-emerald-950">
              <div className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">
                🏆 Pemenang Ronde Sebelumnya
              </div>
              <div className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tight">
                {gameState.winner.name}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2">
              Menunggu Pemain Bergabung ({gameState?.players.length || 0})
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              Hubungkan semua HP ke jaringan Wi-Fi yang sama dan buka link di atas.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
              {gameState?.players && gameState.players.length > 0 ? (
                gameState.players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm border ${
                      p.afk
                        ? 'bg-slate-900/60 border-slate-800 opacity-60'
                        : 'bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-black mb-1">
                      #{i + 1}
                    </div>
                    <strong className="text-base sm:text-lg font-bold text-slate-100 truncate w-full text-center">
                      {p.name}
                    </strong>
                    {p.afk && (
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                        AFK
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-slate-500 font-medium">
                  Belum ada pemain yang masuk. Minta temanmu membuka <strong className="text-slate-300">http://{hostIp}:3000</strong> di HP!
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm sm:text-base">
                <label className="flex items-center gap-2 font-medium text-slate-300">
                  <span>Max HP:</span>
                  <select
                    value={config.maxHp}
                    onChange={(e) =>
                      setConfig({ ...config, maxHp: Number(e.target.value) as 1 | 2 | 3 })
                    }
                    className="bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={1}>1 HP (Hardcore)</option>
                    <option value={2}>2 HP (Standar)</option>
                    <option value={3}>3 HP (Santai)</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-300">
                  <span>Waktu per Giliran:</span>
                  <select
                    value={config.timePerTurn}
                    onChange={(e) =>
                      setConfig({ ...config, timePerTurn: Number(e.target.value) })
                    }
                    className="bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={5}>5 Detik (Super Cepat)</option>
                    <option value={10}>10 Detik (Standar)</option>
                    <option value={15}>15 Detik</option>
                    <option value={20}>20 Detik</option>
                  </select>
                </label>
              </div>

              {(() => {
                const activePlayersCount =
                  gameState?.players.filter((p) => !p.afk).length || 0
                return (
                  <button
                    onClick={() => startGame(config)}
                    disabled={activePlayersCount < 2}
                    className="px-10 py-4 text-xl font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl shadow-xl transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    🚀 MULAI GAME{' '}
                    {activePlayersCount < 2
                      ? '(Minimal 2 Pemain Aktif / Tidak AFK)'
                      : ''}
                  </button>
                )
              })()}
            </div>
          </div>
        </main>
      )}

      {gameState?.gameStatus && (
        <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full py-6 space-y-6">
          {/* Main Stage: Current Word */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400">
              Kata Saat Ini (Kata ke-{gameState.usedWordsCount})
            </div>
            <div className="text-5xl sm:text-7xl md:text-8xl font-black tracking-wider uppercase my-4 sm:my-6 flex items-center justify-center flex-wrap gap-1">
              <span>{gameState.currentWord.slice(0, -1)}</span>
              <span className="text-red-400 bg-red-950/70 px-3 py-1 rounded-2xl border border-red-500/40 underline decoration-4 underline-offset-8">
                {gameState.lastChar}
              </span>
            </div>
            <div className="text-base sm:text-2xl text-amber-300 font-semibold flex items-center justify-center gap-2">
              <span>Huruf awal kata berikutnya:</span>
              <strong className="text-2xl sm:text-3xl uppercase text-red-400 font-black px-2 py-0.5 bg-red-950/50 rounded-lg">
                "{gameState.lastChar}"
              </strong>
            </div>
          </div>

          <div
            className={`border-2 rounded-3xl p-5 sm:p-6 shadow-xl transition-all ${
              timeLeft <= 3 && timeLeft > 0
                ? 'bg-rose-950/80 border-rose-500 shadow-rose-500/30 animate-pulse'
                : 'bg-blue-950/70 border-blue-500 shadow-blue-500/20'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="text-xl sm:text-3xl font-black text-blue-100 flex items-center gap-2">
                <span>👉 GILIRAN:</span>
                <span className="text-yellow-300 underline decoration-wavy decoration-yellow-400">
                  {gameState.players[gameState.turnIndex]?.name || '...'}
                </span>
              </div>

              {timeLeft > 0 && (
                <div
                  className={`px-4 py-1.5 rounded-2xl text-lg sm:text-2xl font-black flex items-center gap-2 ${
                    timeLeft <= 3
                      ? 'bg-rose-600 text-white animate-bounce shadow-lg shadow-rose-600/40'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  <span>⏱️</span>
                  <span>{timeLeft}s</span>
                </div>
              )}
            </div>

            <div className="w-full bg-slate-800 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  percentage <= 25
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                    : percentage <= 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Status Pemain:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gameState.players.map((p, idx) => {
                const isCurrentTurn = idx === gameState.turnIndex
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      p.dead
                        ? 'bg-rose-950/30 border-rose-900 opacity-60'
                        : isCurrentTurn
                        ? 'bg-blue-900/70 border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-base sm:text-lg font-bold text-slate-100 truncate">
                        {p.name}
                      </strong>
                      {p.dead && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">
                          GUGUR
                        </span>
                      )}
                      {p.afk && (
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          AFK
                        </span>
                      )}
                    </div>
                    <div className="text-xl tracking-widest">
                      {'❤️'.repeat(p.hp)}
                      {'🖤'.repeat(Math.max(0, (gameState.gameConfig?.maxHp || 2) - p.hp))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleManualEndGame}
                className="px-5 py-2.5 bg-rose-800/80 hover:bg-rose-700 active:scale-95 text-rose-100 font-bold text-sm rounded-xl transition cursor-pointer flex items-center gap-2 border border-rose-600/60 shadow-lg shadow-rose-950"
              >
                <span>⏹️</span>
                <span>Hentikan & Akhiri Permainan</span>
              </button>
            </div>
          </div>
        </main>
      )}

      <footer className="text-center text-xs text-slate-600 pt-6">
        Sambung Kata • Local LAN Multiplayer Game
      </footer>
    </div>
  )
}


