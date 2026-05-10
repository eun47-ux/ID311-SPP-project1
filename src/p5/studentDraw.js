/**
 * 학생/플레이어 픽셀 아트 렌더링 및 UI 표시
 */

import { PALETTE, TILE, snap } from './palette.js';
import { STUDENT_TILES } from '../lib/students.js';
import { GAME_CONFIG } from '../lib/cafeGame.js';

export const HEAD = TILE * 2; // 32
export { STUDENT_TILES };

/** @typedef {import('../lib/students.js').Student} Student */

/**
 * 타일 좌표 → 픽셀 좌상단 (머리 기준)
 * @param {number} gx
 * @param {number} gy
 */
export function slotToPixel(gx, gy) {
	return { x: gx * TILE, y: gy * TILE };
}

/**
 * 학생 아바타 렌더링 (pixel2.jpg 스타일)
 * @param {import('p5')} p
 * @param {Student} s
 * @param {number} px
 * @param {number} py
 */
export function drawStudentAvatar(p, s, px, py) {
	p.push();
	const x = snap(px);
	const y = snap(py);
	
	if (s.failed) {
		p.fill(120, 120, 120);
		p.rect(x + 4, y + 6, HEAD - 8, HEAD - 8);
		p.fill(...PALETTE.hudText);
		p.textAlign(p.CENTER, p.CENTER);
		p.textSize(10);
		p.text('ZZ', x + HEAD / 2, y + HEAD / 2);
		p.pop();
		return;
	}

	const hairColors = [PALETTE.hairBlack, PALETTE.hairBrown, PALETTE.hairBlonde, PALETTE.hairBlack, PALETTE.hairBrown];
	const hair = hairColors[s.id % hairColors.length] || PALETTE.hairBlack;
	const shirtColors = [PALETTE.shirt0, PALETTE.shirt1, PALETTE.shirt2, PALETTE.shirt3, PALETTE.shirt4];
	const shirt = shirtColors[s.id % shirtColors.length] || PALETTE.shirt0;

	// 몸통 (단순화)
	p.fill(...shirt);
	p.rect(x + 6, y + 24, HEAD - 12, 8);

	// 얼굴 (피부)
	p.fill(...PALETTE.skin);
	p.rect(x + 4, y + 8, HEAD - 8, 16);

	// 머리카락
	p.fill(...hair);
	p.rect(x + 2, y + 4, HEAD - 4, 8); // 윗머리
	p.rect(x + 2, y + 10, 4, 8); // 왼쪽 옆머리
	p.rect(x + HEAD - 6, y + 10, 4, 8); // 오른쪽 옆머리

	// 눈
	p.fill(...PALETTE.outline);
	p.rect(x + 8, y + 14, 4, 4);
	p.rect(x + HEAD - 12, y + 14, 4, 4);

	const reached100 = !s.failed && s.progress >= GAME_CONFIG.WIN_PROGRESS;

	// 상태 말풍선: 100% 완료 시 트로피(픽셀), 그 외 집중 기반 아이콘
	drawMoodBubble(p, s, x, y, reached100);

	// 완료 학생은 하단 게이지 숨김 — 캐릭터만 한눈에
	if (!reached100) {
		const bw = HEAD;
		const bh = 4;
		const bx = x;
		let by = y + HEAD + 2;
		drawChunkBar(p, bx, by, bw, bh, s.focus / 100, PALETTE.barFocus);
		by += bh + 3;
		drawChunkBar(p, bx, by, bw, bh, s.progress / 100, PALETTE.barProg);
	}

	p.pop();
}

/**
 * 말풍선 안 픽셀 트로피 (16x16 영역, 중심 cx, cy)
 * @param {import('p5')} p
 * @param {number} cx
 * @param {number} cy
 */
function drawTrophyPixels(p, cx, cy) {
	const u = 2;
	const ox = Math.round(cx - 4 * u);
	const oy = Math.round(cy - 4 * u);
	const gold = [238, 200, 55];
	const goldHi = [255, 230, 120];
	const shadow = [160, 110, 25];

	p.noStroke();
	// 받침대
	p.fill(...shadow);
	p.rect(ox + u, oy + 6 * u, 6 * u, u);
	p.fill(...gold);
	p.rect(ox + 2 * u, oy + 5 * u, 4 * u, u);
	// 기둥
	p.fill(...shadow);
	p.rect(ox + 3 * u, oy + 3 * u, 2 * u, 2 * u);
	// 컵 몸통
	p.fill(...gold);
	p.rect(ox + u, oy + 1 * u, 6 * u, 2 * u);
	p.fill(...goldHi);
	p.rect(ox + 2 * u, oy + u, 4 * u, u);
	// 손잡이
	p.fill(...gold);
	p.rect(ox, oy + 1 * u, u, 2 * u);
	p.rect(ox + 7 * u, oy + 1 * u, u, 2 * u);
	// 림
	p.fill(...shadow);
	p.rect(ox, oy, 8 * u, u);
}

/**
 * 픽셀 아트 스타일의 상태 말풍선 그리기
 * @param {import('p5')} p
 * @param {Student} s
 * @param {number} x
 * @param {number} y
 * @param {boolean} reached100
 */
function drawMoodBubble(p, s, x, y, reached100) {
	if (s.failed) return; // 실패 시 ZZ가 이미 그려짐

	const cx = x + HEAD / 2;
	const cy = y - 8;

	p.push();
	p.fill(250, 248, 240);
	p.stroke(...PALETTE.outline);
	p.strokeWeight(1);
	p.rectMode(p.CENTER);
	p.rect(cx, cy, 16, 16);

	p.noStroke();

	if (reached100) {
		p.rectMode(p.CORNER);
		drawTrophyPixels(p, cx, cy);
		p.pop();
		return;
	}

	p.rectMode(p.CENTER);
	if (s.focus > 70) {
		p.fill(100, 180, 100);
		p.rect(cx - 2, cy - 2, 4, 4);
		p.rect(cx + 2, cy - 2, 4, 4);
		p.rect(cx, cy, 4, 4);
		p.rect(cx, cy + 2, 2, 2);
	} else if (s.focus > 30) {
		p.fill(220, 150, 40);
		p.rect(cx - 3, cy, 2, 2);
		p.rect(cx, cy, 2, 2);
		p.rect(cx + 3, cy, 2, 2);
	} else {
		p.fill(220, 80, 80);
		p.rect(cx, cy - 2, 2, 6);
		p.rect(cx, cy + 4, 2, 2);
	}
	p.pop();
}

/**
 * 플레이어 캐릭터 렌더링 (바리스타/매니저 느낌)
 * @param {import('p5')} p
 * @param {number} px
 * @param {number} py
 */
export function drawPlayerAvatar(p, px, py) {
	p.push();
	const x = px; // snap하지 않고 부드러운 이동
	const y = py;

	// 몸통 (바리스타 앞치마 느낌)
	p.fill(50, 50, 50); // 셔츠
	p.rect(x + 6, y + 24, HEAD - 12, 8);
	p.fill(160, 120, 80); // 갈색 앞치마
	p.rect(x + 8, y + 24, HEAD - 16, 8);

	// 얼굴 (피부)
	p.fill(...PALETTE.skin);
	p.rect(x + 4, y + 8, HEAD - 8, 16);

	// 머리카락 (플레이어는 짙은 색)
	p.fill(40, 30, 30);
	p.rect(x + 2, y + 4, HEAD - 4, 8);
	p.rect(x + 2, y + 10, 4, 4); 
	p.rect(x + HEAD - 6, y + 10, 4, 4); 

	// 눈
	p.fill(...PALETTE.outline);
	p.rect(x + 8, y + 14, 4, 4); 
	p.rect(x + HEAD - 12, y + 14, 4, 4); 

	// 플레이어 식별 마커 (머리 위 ▼) — 색은 PALETTE.playerMarker
	p.fill(...PALETTE.playerMarker);
	p.textAlign(p.CENTER, p.BOTTOM);
	p.textSize(10);
	p.stroke(...PALETTE.outline);
	p.strokeWeight(2);
	p.text('▼', x + HEAD / 2, y + 2);
	p.noStroke();

	p.pop();
}

/**
 * @param {import('p5')} p
 * @param {number} bx
 * @param {number} by
 * @param {number} bw
 * @param {number} bh
 * @param {number} ratio 0~1
 * @param {number[]} fillRgb
 */
function drawChunkBar(p, bx, by, bw, bh, ratio, fillRgb) {
	const segments = 10;
	const segW = bw / segments;
	p.fill(...PALETTE.barTrack);
	p.rect(bx, by, bw, bh);
	const filled = Math.round(ratio * segments);
	p.fill(...fillRgb);
	for (let i = 0; i < filled; i++) {
		p.rect(bx + i * segW + 1, by + 1, segW - 2, bh - 2);
	}
}

/**
 * @param {number} mx
 * @param {number} my
 * @param {Student} s
 * @param {number} px
 * @param {number} py
 */
export function hitStudent(mx, my, s, px, py) {
	const x = snap(px);
	const y = snap(py);
	return mx >= x && mx <= x + HEAD && my >= y && my <= y + HEAD;
}
