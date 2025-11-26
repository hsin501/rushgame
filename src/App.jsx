// 檔名建議: App.jsx
// 在 VS Code 中請將此檔案存為 App.jsx

import React, { useEffect, useRef } from 'react';
import { GameUI } from './components/GameUI';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { GameState } from './types';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const canvasRef = useRef(null);
  const { gameState, score, highScore, distance, startGame, jump } =
    useGameEngine(canvasRef);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === GameState.PLAYING) {
          jump();
        } else if (
          gameState === GameState.START ||
          gameState === GameState.GAME_OVER
        ) {
          startGame();
        }
      }
    };

    const handleTouch = (e) => {
      if (e.target.tagName !== 'BUTTON') {
        if (gameState === GameState.PLAYING) {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [gameState, jump, startGame]);

  return (
    <div className='game-wrapper'>
      <div className='game-container'>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={() => gameState === GameState.PLAYING && jump()}
        />
        <GameUI
          gameState={gameState}
          score={score}
          highScore={highScore}
          distance={distance}
          onStart={startGame}
          onRestart={startGame}
        />
      </div>
      <div className='mobile-hint'>輕觸螢幕跳躍 (可二段跳)</div>
    </div>
  );
}
