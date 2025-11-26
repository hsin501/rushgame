import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PLAYER_SIZE,
  INITIAL_CONFIG,
} from '../constants.js';
import { GameState } from '../types.js';
import {
  checkAABB,
  createCoinParticles,
  generateInitialPlatforms,
  generateNextPlatform,
} from '../services/engine.js';
import { drawScene } from '../services/renderer.js';

export const useGameEngine = (canvasRef) => {
  const requestRef = useRef(0);
  const playerRef = useRef({
    x: 100,
    y: 0,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    isGrounded: false,
  });
  const platformsRef = useRef([]);
  const coinsRef = useRef([]);
  const particlesRef = useRef([]);
  const gameSpeedRef = useRef(INITIAL_CONFIG.speedBase);
  const distanceRef = useRef(0);
  const cameraXRef = useRef(0);
  const scoreRef = useRef(0);
  const jumpCountRef = useRef(0);

  const [gameState, setGameState] = useState(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);

  const initGame = useCallback(() => {
    playerRef.current = {
      x: 100,
      y: CANVAS_HEIGHT - 300,
      w: PLAYER_SIZE,
      h: PLAYER_SIZE,
      vy: 0,
      isGrounded: false,
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

  const startGame = useCallback(() => {
    initGame();
    setGameState(GameState.PLAYING);
  }, [initGame]);

  const jump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    if (playerRef.current.isGrounded) {
      playerRef.current.vy = INITIAL_CONFIG.jumpForce;
      playerRef.current.isGrounded = false;
      jumpCountRef.current = 1;
    } else if (jumpCountRef.current < 2) {
      playerRef.current.vy = INITIAL_CONFIG.jumpForce * 0.8;
      jumpCountRef.current += 1;

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

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;

    if (gameSpeedRef.current < INITIAL_CONFIG.speedMax) {
      gameSpeedRef.current += INITIAL_CONFIG.acceleration;
    }

    const currentSpeed = gameSpeedRef.current;
    distanceRef.current += currentSpeed;

    if (Math.floor(distanceRef.current) % 10 === 0) {
      setDisplayDistance(Math.floor(distanceRef.current));
    }

    player.x += currentSpeed;
    cameraXRef.current = player.x - 200;

    player.vy += INITIAL_CONFIG.gravity;
    player.y += player.vy;

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
        if (
          player.vy > 0 &&
          player.y + player.h - player.vy <= platform.y + 15
        ) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.isGrounded = true;
          jumpCountRef.current = 0;
        }
      }
    }

    if (player.y > CANVAS_HEIGHT + 100) {
      setGameState(GameState.GAME_OVER);
      setHighScore((prev) => Math.max(prev, scoreRef.current));
      return;
    }

    coinsRef.current.forEach((coin) => {
      if (!coin.collected && checkAABB(player, coin)) {
        coin.collected = true;
        scoreRef.current += coin.value;
        setScore(scoreRef.current);
        particlesRef.current.push(...createCoinParticles(coin.x, coin.y));
      }
    });

    const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
    if (lastPlatform && lastPlatform.x < cameraXRef.current + CANVAS_WIDTH + 200) {
      const difficulty = distanceRef.current / 3000;
      const { platform, coins } = generateNextPlatform(
        lastPlatform,
        difficulty,
        currentSpeed
      );
      platformsRef.current.push(platform);
      coinsRef.current.push(...coins);
    }

    if (platformsRef.current.length > 20) {
      platformsRef.current = platformsRef.current.filter(
        (p) => p.x + p.w > cameraXRef.current - 200
      );
      coinsRef.current = coinsRef.current.filter(
        (c) => c.x + c.w > cameraXRef.current - 200
      );
    }

    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
  }, [gameState]);

  const drawFrame = useCallback(() => {
    drawScene(canvasRef.current, {
      player: playerRef.current,
      platforms: platformsRef.current,
      coins: coinsRef.current,
      particles: particlesRef.current,
      cameraX: cameraXRef.current,
      canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    });
  }, [canvasRef]);

  const loop = useCallback(() => {
    update();
    drawFrame();

    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(loop);
    }
  }, [update, drawFrame, gameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return {
    gameState,
    score,
    highScore,
    distance: displayDistance,
    startGame,
    jump,
  };
};
