import { COLORS } from '../constants.js';

const withContext = (canvas) => {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  return ctx || null;
};

export const drawScene = (canvas, state) => {
  const ctx = withContext(canvas);
  if (!ctx) return;

  const {
    player,
    platforms = [],
    coins = [],
    particles = [],
    cameraX = 0,
    canvasSize,
    colors = COLORS,
  } = state;

  const width = canvasSize?.width ?? canvas?.width ?? 0;
  const height = canvasSize?.height ?? canvas?.height ?? 0;

  ctx.fillStyle = colors.skyEnd;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.skyStart);
  gradient.addColorStop(1, colors.skyEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const offsetX = Math.floor(cameraX) % 100;
  for (let x = -offsetX; x < width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  platforms.forEach((p) => {
    ctx.fillStyle = colors.platform;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = colors.platformTop;
    ctx.fillRect(p.x, p.y, p.w, 8);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(p.x + 10, p.y + 15, p.w - 20, 4);
  });

  coins.forEach((c) => {
    if (c.collected) return;
    const centerX = c.x + c.w / 2;
    const centerY = c.y + c.h / 2;
    const bobOffset = Math.sin(Date.now() / 200) * 5;

    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.bitcoin;
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

  if (player) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(player.x - 20, player.y, player.w, player.h);

    ctx.fillStyle = colors.player;
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.player;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = 'white';
    ctx.shadowBlur = 0;
    ctx.fillRect(player.x + player.w - 12, player.y + 8, 8, 8);
  }

  particles.forEach((part) => {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life;
    ctx.fillRect(part.x, part.y, part.w, part.h);
    ctx.globalAlpha = 1.0;
  });

  ctx.restore();
};
