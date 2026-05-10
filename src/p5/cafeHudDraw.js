/**
 * 상단 HUD — rect + 텍스트 (청크 스타일)
 */

import { PALETTE, TILE } from './palette.js';
import { GAME_CONFIG } from '../lib/cafeGame.js';

/** @param {import('p5')} p */
export function drawHudBar(p, widthPx) {
	const h = TILE * 2;
	p.fill(...PALETTE.hudBg);
	p.rect(0, 0, widthPx, h);
}

/**
 * @param {import('p5')} p
 * @param {import('../lib/cafeGame.js').CafeGame} game
 * @param {number} widthPx
 */
export function drawHudText(p, game, widthPx) {
	p.fill(...PALETTE.hudText);
	p.textAlign(p.LEFT, p.TOP);
	p.textSize(8);
	const pad = 8;
	const l1 = `TIME ${Math.ceil(game.remainingSeconds)}  |  NOISE ${game.getNoiseLabel()}  |  M=Noise W=Window`;
	const l2 = `Goal ${GAME_CONFIG.WIN_STUDENT_COUNT}st ${GAME_CONFIG.WIN_PROGRESS}%  |  Done ${game.getCompletedCount()}  Fail ${game.getFailedCount()}`;
	p.text(l1, pad, 6);
	p.text(l2, pad, 6 + 12);
}
