// 檔名建議: App.jsx
// 在 VS Code 中請將此檔案存為 App.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameUI } from './components/GameUI';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  INITIAL_CONFIG,
  COLORS,
} from './constants';
import { GameState } from './types';
import {
  checkAABB,
  generateInitialPlatforms,
  generateNextPlatform,
  createCoinParticles,
} from './services/engine';

export default function App() {
  // --- Refs for High-Frequency Logic (State that changes 60fps) ---
  const requestRef = useRef(0);
  const playerRef = useRef({
    x: 100,
    y: 0,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    isGrounded: false,
    color: COLORS.player,
  });
  const platformsRef = useRef([]);
  const coinsRef = useRef([]);
  const particlesRef = useRef([]);
  const gameSpeedRef = useRef(INITIAL_CONFIG.speedBase);
  const distanceRef = useRef(0);
  const cameraXRef = useRef(0);
  const scoreRef = useRef(0);
  const jumpCountRef = useRef(0); // Track jumps for double jump

  // --- React State for Rendering and UI ---
  const [gameState, setGameState] = useState(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);

  // Canvas Ref
  const canvasRef = useRef(null);

  // --- Initialization ---
  const initGame = useCallback(() => {
    playerRef.current = {
      x: 100,
      y: CANVAS_HEIGHT - 300,
      w: PLAYER_SIZE,
      h: PLAYER_SIZE,
      vy: 0,
      isGrounded: false,
      color: COLORS.player,
    };
    platformsRef.current = generateInitialPlatforms();
    coinsRef.current = [];
    particlesRef.current = [];
    gameSpeedRef.current = INITIAL_CONFIG.speedBase;
    distanceRef.current = 0;
    cameraXRef.current = 0;
    scoreRef.current = 0;
    jumpCountRef.current = 0;
    setScore(0);
    setDisplayDistance(0);
  }, []);

  const startGame = () => {
    initGame();
    setGameState(GameState.PLAYING);
  };

  const jump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // Double Jump Logic
    // 0 = Grounded jump, 1 = Air jump
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = INITIAL_CONFIG.jumpForce;
      playerRef.current.isGrounded = false;
      jumpCountRef.current = 1;
    } else if (jumpCountRef.current < 2) {
      // Second jump is slightly weaker for control
      playerRef.current.vy = INITIAL_CONFIG.jumpForce * 0.8;
      jumpCountRef.current += 1;

      // Particle effect for double jump
      const p = playerRef.current;
      particlesRef.current.push({
        id: Math.random(),
        x: p.x + p.w / 2,
        y: p.y + p.h,
        w: 6,
        h: 6,
        vx: -2,
        vy: 2,
        life: 0.5,
        color: '#ffffff',
      });
    }
  }, [gameState]);

  // --- Main Game Loop ---
  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;

    // 1. Update Speed (Difficulty)
    if (gameSpeedRef.current < INITIAL_CONFIG.speedMax) {
      gameSpeedRef.current += INITIAL_CONFIG.acceleration;
    }

    const currentSpeed = gameSpeedRef.current;
    distanceRef.current += currentSpeed;

    // Update React State occasionally
    if (Math.floor(distanceRef.current) % 10 === 0) {
      setDisplayDistance(Math.floor(distanceRef.current));
    }

    // 2. Move Player (Horizontal)
    player.x += currentSpeed;
    cameraXRef.current = player.x - 200;

    // 3. Apply Gravity & Vertical Movement
    player.vy += INITIAL_CONFIG.gravity;
    player.y += player.vy;

    // 4. Ground/Platform Collision
    player.isGrounded = false;

    const relevantPlatforms = platformsRef.current.filter(
      (p) => p.x < player.x + player.w + 100 && p.x + p.w > player.x - 100
    );

    for (const platform of relevantPlatforms) {
      if (
        player.x < platform.x + platform.w &&
        player.x + player.w > platform.x &&
        player.y + player.h > platform.y &&
        player.y < platform.y + platform.h
      ) {
        // Land on top
        if (
          player.vy > 0 &&
          player.y + player.h - player.vy <= platform.y + 15
        ) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.isGrounded = true;
          jumpCountRef.current = 0; // Reset jumps on landing
        }
      }
    }

    // 5. Pit Death
    if (player.y > CANVAS_HEIGHT + 100) {
      setGameState(GameState.GAME_OVER);
      setHighScore((prev) => Math.max(prev, scoreRef.current));
      return;
    }

    // 6. Coin Collection
    coinsRef.current.forEach((coin) => {
      if (!coin.collected && checkAABB(player, coin)) {
        coin.collected = true;
        scoreRef.current += coin.value;
        setScore(scoreRef.current);
        particlesRef.current.push(...createCoinParticles(coin.x, coin.y));
      }
    });

    // 7. Generate Terrain
    const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
    if (lastPlatform.x < cameraXRef.current + CANVAS_WIDTH + 200) {
      // Difficulty increases with distance
      const difficulty = distanceRef.current / 3000;
      const { platform, coins } = generateNextPlatform(
        lastPlatform,
        difficulty,
        currentSpeed
      );
      platformsRef.current.push(platform);
      coinsRef.current.push(...coins);
    }

    // 8. Cleanup
    if (platformsRef.current.length > 20) {
      platformsRef.current = platformsRef.current.filter(
        (p) => p.x + p.w > cameraXRef.current - 200
      );
      coinsRef.current = coinsRef.current.filter(
        (c) => c.x + c.w > cameraXRef.current - 200
      );
    }

    // 9. Particles
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
  }, [gameState]);

  // --- Rendering (Canvas) ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.skyEnd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.skyStart);
    gradient.addColorStop(1, COLORS.skyEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const offsetX = Math.floor(cameraXRef.current) % 100;
    for (let x = -offsetX; x < canvas.width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(-cameraXRef.current, 0);

    // Platforms
    platformsRef.current.forEach((p) => {
      ctx.fillStyle = COLORS.platform;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = COLORS.platformTop;
      ctx.fillRect(p.x, p.y, p.w, 8);

      // Decorative details
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x + 10, p.y + 15, p.w - 20, 4);
    });

    // Coins
    coinsRef.current.forEach((c) => {
      if (c.collected) return;
      const centerX = c.x + c.w / 2;
      const centerY = c.y + c.h / 2;

      // Bobbing animation
      const bobOffset = Math.sin(Date.now() / 200) * 5;

      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.bitcoin;
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(centerX, centerY + bobOffset, c.w / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₿', centerX, centerY + bobOffset + 1);
    });

    // Player
    const p = playerRef.current;

    // Trail
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(p.x - 20, p.y, p.w, p.h);

    ctx.fillStyle = COLORS.player;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.player;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 0;
    ctx.fillRect(p.x + p.w - 12, p.y + 8, 8, 8);

    // Particles
    particlesRef.current.forEach((part) => {
      ctx.fillStyle = part.color;
      ctx.globalAlpha = part.life;
      ctx.fillRect(part.x, part.y, part.w, part.h);
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  }, []);

  const loop = useCallback(() => {
    update();
    draw();
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(loop);
    } else if (
      gameState === GameState.START ||
      gameState === GameState.GAME_OVER
    ) {
      draw();
    }
  }, [update, draw, gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === GameState.PLAYING) {
          jump();
        } else {
          if (gameState === GameState.GAME_OVER) startGame();
          if (gameState === GameState.START) startGame();
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
  }, [gameState, jump]);

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
          distance={displayDistance}
          onStart={startGame}
          onRestart={startGame}
        />
      </div>
      <div className='mobile-hint'>輕觸螢幕跳躍 (可二段跳)</div>
    </div>
  );
}
