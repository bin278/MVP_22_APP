import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Trophy, Target, Zap } from 'lucide-react'

export default function App() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, points: number}>>([])

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameStatus('gameOver')
      setIsPlaying(false)
    }
  }, [timeLeft, isPlaying])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTargets(prev => [
          ...prev.slice(-2), // Keep only last 2 targets
          {
            id: Date.now(),
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            points: Math.floor(Math.random() * 50) + 10
          }
        ])
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const startGame = () => {
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setGameStatus('playing')
    setIsPlaying(true)
  }

  const pauseGame = () => {
    setIsPlaying(!isPlaying)
    setGameStatus(isPlaying ? 'paused' : 'playing')
  }

  const resetGame = () => {
    setIsPlaying(false)
    setGameStatus('waiting')
    setScore(0)
    setTimeLeft(60)
    setTargets([])
  }

  const hitTarget = (targetId: number, points: number) => {
    setScore(prev => prev + points)
    setTargets(prev => prev.filter(t => t.id !== targetId))
  }

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting': return 'Click Play to start!'
      case 'paused': return 'Game Paused'
      case 'gameOver': return 'Game Over!'
      default: return 'Playing...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-center">
            {prompt || 'Game Page'} 🎮
          </h1>
        </div>
      </header>

      {/* Game Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-sm opacity-80">Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold">{timeLeft}</div>
            <div className="text-sm opacity-80">Time Left</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">{targets.length}</div>
            <div className="text-sm opacity-80">Targets</div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {gameStatus === 'waiting' || gameStatus === 'gameOver' ? (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              {gameStatus === 'gameOver' ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={pauseGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          <div className="text-xl font-semibold">{getStatusMessage()}</div>
        </div>

        {/* Game Area */}
        <div className="relative bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 h-96 overflow-hidden">
          {/* Game Instructions */}
          {gameStatus === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold mb-2">Target Practice Game</h2>
                <p className="text-lg opacity-80 mb-4">
                  Click on targets to score points!<br />
                  You have 60 seconds to get the highest score.
                </p>
                <div className="text-sm opacity-60">
                  Different targets give different points
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameStatus === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
                <div className="text-sm opacity-80">
                  {score > 500 ? 'Excellent!' : score > 300 ? 'Great job!' : score > 100 ? 'Good effort!' : 'Keep practicing!'}
                </div>
              </div>
            </div>
          )}

          {/* Targets */}
          {isPlaying && targets.map(target => (
            <button
              key={target.id}
              onClick={() => hitTarget(target.id, target.points)}
              className="absolute w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse border-2 border-white/30"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
              }}
              title={`+${target.points} points`}
            >
              <div className="text-white font-bold text-sm">
                {target.points}
              </div>
            </button>
          ))}

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 text-2xl">🎯</div>
            <div className="absolute top-8 right-8 text-xl">⭐</div>
            <div className="absolute bottom-8 left-8 text-xl">🎮</div>
            <div className="absolute bottom-4 right-4 text-2xl">🏆</div>
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-6 text-center text-sm opacity-80">
          <p>Click on targets to score points • Higher targets = more points • Beat your high score!</p>
        </div>
      </div>
    </div>
  )
}