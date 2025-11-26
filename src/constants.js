// 檔名建議: constants.js
// 在 VS Code 中請將此檔案存為 constants.js

export const CANVAS_WIDTH = 1200; // Virtual width for calculation
export const CANVAS_HEIGHT = 600; // Virtual height for calculation

export const PLAYER_SIZE = 40;
export const COIN_SIZE = 30;

export const INITIAL_CONFIG = {
  gravity: 0.8,
  jumpForce: -16,
  speedBase: 8, // Start faster
  speedMax: 30, // Higher maximum speed
  acceleration: 0.005, // Acceleration is 5x faster than before
};

export const COLORS = {
  skyStart: '#1e293b', // slate-800
  skyEnd: '#0f172a', // slate-900
  platform: '#64748b', // slate-500
  platformTop: '#94a3b8', // slate-400
  bitcoin: '#f59e0b', // amber-500
  player: '#ef4444', // red-500
};
