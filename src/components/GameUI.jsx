import React from 'react';
import { GameState } from '../types';
import { Play, RotateCcw, Coins, Trophy, Footprints } from 'lucide-react';

export const GameUI = ({
  gameState,
  score,
  highScore,
  distance,
  onStart,
  onRestart,
}) => {
  if (gameState === GameState.PLAYING) {
    return (
      <div className='ui-overlay'>
        <div className='hud-group'>
          <div className='hud-pill gold'>
            <Coins size={20}/>
            <span>{score}</span>
          </div>
          <div className='hud-pill small'>
            距離: {Math.floor(distance / 10)}m
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.START) {
    return (
      <div className='menu-overlay'>
        <div className='menu-card'>
          <h1 className='title'>rushgame</h1>
          <p className='subtitle'>
            按下 <span className='key-hint'>空白鍵</span> 或{' '}
            <span className='key-hint'>點擊螢幕</span> 跳躍。
            <br />
            收集比特幣，越跑越快，小心掉落！
          </p>
          <button onClick={onStart} className='btn btn-primary'>
            <Play
              size={24}
              style={{ marginRight: '8px', fill: 'currentColor' }}
            />
            開始遊戲
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className='menu-overlay game-over-bg'>
        <div className='menu-card game-over-card'>
          <h2 className='title' style={{ color: 'white', background: 'none' }}>
            遊戲結束
          </h2>

          <div className='stats-grid'>
            <div className='stat-row'>
              <span className='stat-label'>
                <Coins size={22} /> 本局得分
              </span>
              <span className='stat-value gold'>{score}</span>
            </div>
            <div className='stat-row'>
              <span className='stat-label'>
                <Footprints size={22} />
                奔跑距離
              </span>
              <span className='stat-value white'>
                {Math.floor(distance / 10)}m
              </span>
            </div>
            <div className='stat-row'>
              <span className='stat-label'>
                <Trophy size={22} /> 最高分
              </span>
              <span className='stat-value white'>{highScore}</span>
            </div>
          </div>

          <button onClick={onRestart} className='btn btn-danger'>
            <RotateCcw size={24} style={{ marginRight: '8px' }} />
            再玩一次
          </button>
        </div>
      </div>
    );
  }

  return null;
};
