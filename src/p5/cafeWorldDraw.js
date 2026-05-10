/**
 * 단순화된 정사각형 카페 환경 (중앙 4개 테이블, 좌우 창문)
 */

import { PALETTE, TILE, COLS, ROWS, snap } from './palette.js';

/** @param {import('p5')} p */
export function drawFloor(p) {
	p.noStroke();
	for (let gy = 0; gy < ROWS; gy++) {
		for (let gx = 0; gx < COLS; gx++) {
			const c = (gx + gy) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
			p.fill(...c);
			p.rect(gx * TILE, gy * TILE, TILE, TILE);
		}
	}
}

/** @param {import('p5')} p */
export function drawWallsAndWindows(p, isWindowOpen) {
	const wallH = TILE * 2;
	
	// 상단 벽
	p.fill(...PALETTE.wall);
	p.rect(0, 0, COLS * TILE, wallH);
	p.fill(...PALETTE.wallTrim);
	p.rect(0, wallH - 4, COLS * TILE, 4);
	
	// 중앙 문
	const doorW = TILE * 4;
	const doorX = snap((COLS * TILE) / 2 - doorW / 2);
	p.fill(...PALETTE.floorB);
	p.rect(doorX, TILE * 0.35, doorW, TILE * 1.4);
	p.stroke(...PALETTE.wallTrim);
	p.noFill();
	p.rect(doorX, TILE * 0.35, doorW, TILE * 1.4);
	p.noStroke();

	// 좌우 창문 (5~9, 13~17 위치)
	p.stroke(...PALETTE.wallTrim);
	if (isWindowOpen) {
		p.fill(130, 220, 250, 150);
		p.rect(0, TILE * 5, TILE, TILE * 2);
		p.rect(0, TILE * 13, TILE, TILE * 2);
		p.rect((COLS - 1) * TILE, TILE * 5, TILE, TILE * 2);
		p.rect((COLS - 1) * TILE, TILE * 13, TILE, TILE * 2);

		p.fill(200, 240, 255, 200);
		p.rect(0, TILE * 7, TILE, TILE * 2);
		p.rect(0, TILE * 15, TILE, TILE * 2);
		p.rect((COLS - 1) * TILE, TILE * 7, TILE, TILE * 2);
		p.rect((COLS - 1) * TILE, TILE * 15, TILE, TILE * 2);

		p.stroke(255, 255, 255, 200);
		p.strokeWeight(2);
		p.line(TILE, TILE * 6, TILE * 3, TILE * 6);
		p.line(TILE, TILE * 7, TILE * 2, TILE * 7);
		p.line((COLS - 3) * TILE, TILE * 6, (COLS - 1) * TILE, TILE * 6);
		p.line((COLS - 2) * TILE, TILE * 7, (COLS - 1) * TILE, TILE * 7);
		p.strokeWeight(1);
	} else {
		p.fill(200, 220, 240, 120);
		p.rect(0, TILE * 5, TILE, TILE * 4);
		p.rect(0, TILE * 13, TILE, TILE * 4);
		p.rect((COLS - 1) * TILE, TILE * 5, TILE, TILE * 4);
		p.rect((COLS - 1) * TILE, TILE * 13, TILE, TILE * 4);
		
		p.line(0, TILE * 7, TILE, TILE * 7);
		p.line(0, TILE * 15, TILE, TILE * 15);
		p.line((COLS - 1) * TILE, TILE * 7, COLS * TILE, TILE * 7);
		p.line((COLS - 1) * TILE, TILE * 15, COLS * TILE, TILE * 15);
	}
	p.noStroke();
}

/** @param {import('p5')} p */
export function drawTables(p) {
	p.noStroke();
	
	// 중앙 4개의 테이블 (3x3 타일 크기)
	// 22x22 맵에 맞춰 배치
	drawSquareTable(p, 5, 7);
	drawSquareTable(p, 14, 7);
	drawSquareTable(p, 5, 14);
	drawSquareTable(p, 14, 14);

	// 좌측 상단 카운터 (바리스타 공간)
	const baseX = TILE * 2;
	const baseY = TILE * 2;
	p.fill(...PALETTE.counterBase);
	p.rect(baseX, baseY, TILE * 6, TILE * 3);
	p.fill(...PALETTE.counterTop);
	p.rect(baseX, baseY, TILE * 6, TILE * 1);
	
	// 카운터 장식 (커피 머신 등)
	p.fill(...PALETTE.tableEdge);
	p.rect(baseX + TILE * 1, baseY - TILE * 0.5, TILE * 1.5, TILE * 1);
	p.rect(baseX + TILE * 4, baseY - TILE * 0.5, TILE * 1.2, TILE * 0.8);

	// 좌측 하단 대형 스피커 (M 음악)
	const sx = TILE * 1;
	const sy = (ROWS - 4) * TILE;
	p.fill(40, 40, 40);
	p.rect(sx, sy, TILE * 2, TILE * 3);
	p.fill(20, 20, 20);
	p.circle(sx + TILE, sy + TILE, TILE * 1.5);
	p.circle(sx + TILE, sy + TILE * 2.2, TILE * 1);
}

/** @param {import('p5')} p */
function drawSquareTable(p, gx, gy) {
	const w = TILE * 3;
	const h = TILE * 3;
	const x = gx * TILE;
	const y = gy * TILE;
	
	// 의자 4개 (상, 하, 좌, 우)
	p.fill(...PALETTE.chair);
	const c = TILE * 0.8;
	p.rect(x - c, y + TILE, c, TILE); // 좌
	p.rect(x + w, y + TILE, c, TILE); // 우
	p.rect(x + TILE, y - c, TILE, c); // 상
	p.rect(x + TILE, y + h, TILE, c); // 하

	// 테이블 상판
	p.fill(...PALETTE.table);
	p.rect(x, y, w, h);
	p.stroke(...PALETTE.tableEdge);
	p.noFill();
	p.rect(x, y, w, h);
	p.noStroke();
}

/** @param {import('p5')} p */
export function drawWorld(p, isWindowOpen) {
	drawFloor(p);
	drawTables(p);
	drawWallsAndWindows(p, isWindowOpen);
}
