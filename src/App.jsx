import React, { useEffect, useRef } from 'react';
import { GameUI } from './components/GameUI';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { GameState } from './types';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const canvasRef = useRef(null);
  const { gameState, score, highScore, distance, startGame, jump } =
    useGameEngine(canvasRef);

  const requestFullscreen = () => {
    const el = document.documentElement;
    const fn =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;
    if (fn) {
      fn.call(el).catch(() => {});
    }
  };

  const handleStart = () => {
    requestFullscreen();
    startGame();
  };

  const handlePointerDown = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (gameState === GameState.PLAYING) {
      jump();
    } else if (
      gameState === GameState.START ||
      gameState === GameState.GAME_OVER
    ) {
      handleStart();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === GameState.PLAYING) {
          jump();
        } else if (
          gameState === GameState.START ||
          gameState === GameState.GAME_OVER
        ) {
          handleStart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, jump, startGame]);

  return (
    <>
      <div className="orientation-lock">
        <div className="phone-icon"></div>
        <div className="lock-text">請將手機轉為橫向<br/>以獲得最佳遊戲體驗</div>
      </div>
     <div className='game-wrapper'>
      <div className='game-container'>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
        />
        <GameUI
          gameState={gameState}
          score={score}
          highScore={highScore}
          distance={distance}
          onStart={handleStart}
          onRestart={handleStart}
        />
      </div>
      <div className='mobile-hint'>輕觸螢幕跳躍 (可二段跳)</div>
    </div>
    </>
   
  );
}
