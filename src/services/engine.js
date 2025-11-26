// 檔名建議: engine.js
// 在 VS Code 中請將此檔案存為 services/engine.js

import { CANVAS_HEIGHT, CANVAS_WIDTH, COIN_SIZE } from '../constants';

// --- Collision Detection ---

export const checkAABB = (r1, r2) => {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
};

// --- Procedural Generation ---

export const generateInitialPlatforms = () => {
  const platforms = [];
  // Start with a long safe ground
  platforms.push({
    id: 1,
    x: 0,
    y: CANVAS_HEIGHT - 100,
    w: CANVAS_WIDTH,
    h: 100,
    type: 'ground',
  });
  return platforms;
};

export const generateNextPlatform = (
  lastPlatform,
  difficultyMultiplier,
  currentSpeed
) => {
  // --- Physics Constants derived from INITIAL_CONFIG ---
  // Gravity: 0.8, JumpForce: -16
  // Max Jump Height = v0^2 / 2g = 256 / 1.6 = 160px
  // Time to Peak = v0 / g = 20 frames
  // Total Air Time (flat) = 40 frames

  const MAX_JUMP_HEIGHT = 160;
  const MAX_AIR_TIME = 40;

  // Calculate max safe jump distance at current speed
  // Use 0.9 safety factor to allow for human reaction time
  // At high speeds, we allow larger gaps
  const maxSafeDistance = currentSpeed * MAX_AIR_TIME * 0.9;

  // 1. Determine Y (Height)
  let y = lastPlatform.y;

  // Decide height change based on bounds
  const canGoUp = lastPlatform.y > 200;
  const canGoDown = lastPlatform.y < CANVAS_HEIGHT - 150;

  let deltaY = 0;

  // As difficulty increases, verticality becomes more chaotic
  // difficultyMultiplier usually goes from 0 to 10+
  const volatility = Math.min(0.8, 0.3 + difficultyMultiplier * 0.05);

  if (Math.random() < volatility) {
    // Calculate max reachable height upwards
    // We limit upward movement to 140px (near max jump) for high difficulty
    const limitUp = Math.min(140, lastPlatform.y - 100);

    if (Math.random() > 0.5 && canGoUp) {
      // GO UP
      const amount = Math.floor(Math.random() * limitUp + 40);
      deltaY = -amount;
    } else if (canGoDown) {
      // GO DOWN
      // Going down can be steep
      const amount = Math.floor(Math.random() * 200 + 40);
      deltaY = amount;
    }
  }

  y += deltaY;
  // Hard clamp to playable area
  y = Math.max(150, Math.min(CANVAS_HEIGHT - 80, y));

  // 2. Determine X (Gap)
  let maxAllowedGap = maxSafeDistance;

  if (deltaY < 0) {
    // If going UP, reduce gap
    const heightFactor = Math.abs(deltaY) / MAX_JUMP_HEIGHT;
    const penalty = 1 - heightFactor * 0.7;
    maxAllowedGap *= penalty;
  }

  // Calculate minimum gap based on difficulty
  // Gaps get wider as speed increases (difficulty)
  const baseMinGap = 100;
  const difficultyGapAdd = Math.min(300, difficultyMultiplier * 60);
  const minGap = baseMinGap + difficultyGapAdd;

  // Ensure minGap doesn't exceed maxAllowedGap (impossible jump)
  const safeMinGap = Math.min(minGap, maxAllowedGap - 50);

  // Randomize gap
  let gap =
    Math.floor(Math.random() * (maxAllowedGap - safeMinGap)) + safeMinGap;

  // Final safety clamps
  gap = Math.min(gap, maxAllowedGap);
  gap = Math.max(gap, 80); // Absolute minimum gap

  const x = lastPlatform.x + lastPlatform.w + gap;

  // 3. Platform Width
  // Platforms get narrower with difficulty
  // Min width can go down to 80px (very small) at high difficulty
  const narrownessFactor = Math.min(150, difficultyMultiplier * 20);
  const minW = Math.max(80, 200 - narrownessFactor);
  const maxW = Math.max(200, 600 - narrownessFactor * 2);
  const w = Math.floor(Math.random() * (maxW - minW + 1)) + minW;

  const platform = {
    id: Date.now() + Math.random(),
    x,
    y,
    w,
    h: 50, // Standard thickness
    type: 'floating',
  };

  // 4. Generate Coins
  const coins = [];
  if (Math.random() > 0.2) {
    const pattern = Math.floor(Math.random() * 4);

    // Pattern 0: Line of coins (Classic)
    if (pattern === 0) {
      const count = Math.floor(w / (COIN_SIZE * 1.5));
      const maxCoins = 5;
      const actualCoins = Math.min(count, maxCoins);

      for (let i = 0; i < actualCoins; i++) {
        coins.push({
          id: Date.now() + Math.random() + i,
          x: x + 20 + i * COIN_SIZE * 1.5,
          y: y - COIN_SIZE - 20,
          w: COIN_SIZE,
          h: COIN_SIZE,
          collected: false,
          value: 1,
        });
      }
    }
    // Pattern 1: Arc jump hint (in the gap before)
    else if (pattern === 1) {
      if (gap > 150) {
        const midGap = x - gap / 2;
        const peakY = Math.min(y, lastPlatform.y) - 80;

        coins.push({
          id: Date.now() + Math.random(),
          x: midGap,
          y: peakY,
          w: COIN_SIZE,
          h: COIN_SIZE,
          collected: false,
          value: 5, // Bonus coin
        });
        // Add a couple more to form a small arc
        coins.push({
          id: Date.now() + Math.random() + 1,
          x: midGap - 40,
          y: peakY + 20,
          w: COIN_SIZE,
          h: COIN_SIZE,
          collected: false,
          value: 1,
        });
        coins.push({
          id: Date.now() + Math.random() + 2,
          x: midGap + 40,
          y: peakY + 20,
          w: COIN_SIZE,
          h: COIN_SIZE,
          collected: false,
          value: 1,
        });
      }
    }
    // Pattern 2: Stack/Grid (on wider platforms)
    else if (pattern === 2 && w > 150) {
      // 2x2 grid
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          coins.push({
            id: Date.now() + Math.random() + r + c,
            x: x + 40 + c * 40,
            y: y - 40 - r * 40,
            w: COIN_SIZE,
            h: COIN_SIZE,
            collected: false,
            value: 1,
          });
        }
      }
    }
    // Pattern 3: Low Trail (dangerous)
    else if (pattern === 3) {
      coins.push({
        id: Date.now() + Math.random(),
        x: x + w / 2,
        y: y - COIN_SIZE - 10, // Very close to platform
        w: COIN_SIZE,
        h: COIN_SIZE,
        collected: false,
        value: 1,
      });
    }
  }

  return { platform, coins };
};

// --- Particles ---

export const createCoinParticles = (x, y) => {
  const particles = [];
  for (let i = 0; i < 8; i++) {
    particles.push({
      id: Math.random(),
      x: x + COIN_SIZE / 2,
      y: y + COIN_SIZE / 2,
      w: 5,
      h: 5,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 1.0,
      color: '#fbbf24',
    });
  }
  return particles;
};
