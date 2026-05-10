/**
 * p5 instance: title / play / end + CafeGame 연동
 */

import p5 from 'p5';
import { CafeGame } from '../lib/cafeGame.js';
import { drawWorld } from './cafeWorldDraw.js';
import { drawHudBar, drawHudText } from './cafeHudDraw.js';
import { COLS, ROWS, TILE, PALETTE } from './palette.js';
import { drawStudentAvatar, drawPlayerAvatar, hitStudent, HEAD, slotToPixel, STUDENT_TILES } from './studentDraw.js';

const HUD_H = TILE * 2;
const W = COLS * TILE;
const H = ROWS * TILE + HUD_H;

// 플레이어 상태
let playerX = TILE * 10;
let playerY = TILE * 10;
const PLAYER_SPEED = 180;
const INTERACT_RADIUS = TILE * 3.5;

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * @param {HTMLElement} host
 * @returns {{ remove: () => void }}
 */
export function mountP5Game(host) {
	/** @type {'title' | 'play' | 'end'} */
	let uiScreen = 'title';
	/** @type {CafeGame | null} */
	let game = null;
	let endMessage = '';
	let feedback = '';
	let feedbackUntil = 0;
	let usePressStartFont = false;
	let musicalNotes = [];

	const preventScroll = (e) => {
		if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
			e.preventDefault();
		}
	};
	if (typeof window !== 'undefined') {
		window.addEventListener('keydown', preventScroll, { passive: false });
	}

	const sketch = (p) => {
		p.setup = () => {
			const canvas = p.createCanvas(W, H);
			canvas.parent(host);
			// 뷰포트 크기에 맞춰 캔버스 자동 축소 (스크롤 방지)
			canvas.style('max-width', '100%');
			canvas.style('max-height', '85vh');
			canvas.style('width', 'auto');
			canvas.style('height', 'auto');
			
			p.noSmooth();
			p.textFont('monospace');
			p.frameRate(60);
			if (typeof document !== 'undefined' && document.fonts) {
				document.fonts.ready.then(() => {
					usePressStartFont = true;
				});
			}
		};

		p.draw = () => {
			p.textFont(usePressStartFont ? 'Press Start 2P' : 'monospace');
			p.background(32, 36, 32);
			drawHudBar(p, W);

			if (uiScreen === 'play' && game) {
				const dt = p.deltaTime / 1000;
				if (game.phase === 'playing') {
					game.tick(dt);
					
					// 음표 파티클 로직 (High 노이즈일 때 스피커에서 발생)
					if (game.noiseLevel === 'high') {
						if (Math.random() < 0.1) {
							musicalNotes.push({
								x: TILE * 2 + (Math.random() * TILE),
								y: (ROWS - 4) * TILE,
								life: 2.0,
								maxLife: 2.0,
								char: Math.random() > 0.5 ? '🎵' : '♪'
							});
						}
					}
					for (let i = musicalNotes.length - 1; i >= 0; i--) {
						musicalNotes[i].life -= dt;
						musicalNotes[i].y -= dt * 25; // 위로 떠오름
						if (musicalNotes[i].life <= 0) {
							musicalNotes.splice(i, 1);
						}
					}

					// 플레이어 이동 로직
					let dx = 0; let dy = 0;
					if (p.keyIsDown(p.LEFT_ARROW)) dx -= 1;
					if (p.keyIsDown(p.RIGHT_ARROW)) dx += 1;
					if (p.keyIsDown(p.UP_ARROW)) dy -= 1;
					if (p.keyIsDown(p.DOWN_ARROW)) dy += 1;
					
					if (dx !== 0 || dy !== 0) {
						const len = Math.sqrt(dx*dx + dy*dy);
						const nx = playerX + (dx/len) * PLAYER_SPEED * dt;
						const ny = playerY + (dy/len) * PLAYER_SPEED * dt;
						
						// 간단한 경계선 및 장애물 충돌 검사
						const cx = nx + HEAD/2;
						const cy = ny + HEAD; // 발 밑 기준
						
						let collision = false;
						if (nx < 0 || nx > W - HEAD || ny < 0 || ny > ROWS * TILE - HEAD) {
							collision = true;
						}
						// 카운터 충돌 (대략)
						if (cx < TILE * 8 && cy > TILE * 2 && cy < TILE * 5) collision = true;
						
						// 중앙 테이블 4개 충돌 (5,7 / 14,7 / 5,14 / 14,14 주변 3x3)
						const tx = Math.floor(cx / TILE);
						const ty = Math.floor(cy / TILE);
						if ((tx >= 4 && tx <= 8) || (tx >= 13 && tx <= 17)) {
							if ((ty >= 6 && ty <= 10) || (ty >= 13 && ty <= 17)) {
								collision = true;
							}
						}
						
						if (!collision) {
							playerX = nx;
							playerY = ny;
						}
					}
				}
				if (game.phase !== 'playing') {
					endMessage = game.summary.getReflectionMessage({
						completed: game.getCompletedCount(),
						total: game.students.length,
					});
					uiScreen = 'end';
				}
			}

			if (uiScreen === 'play' && game) {
				drawHudText(p, game, W);
			} else {
				p.fill(...PALETTE.hudText);
				p.textAlign(p.LEFT, p.TOP);
				p.textSize(8);
				p.text('Cafe Focus Manager', 8, 8);
			}

			p.push();
			p.translate(0, HUD_H);
			const isWindowOpen = game && game.windowSecondsLeft > 0;
			drawWorld(p, isWindowOpen);

			if (uiScreen === 'play' || uiScreen === 'end') {
				game?.students.forEach((s, i) => {
					const [gx, gy] = STUDENT_TILES[i] ?? [5, 12];
					const { x, y } = slotToPixel(gx, gy);
					drawStudentAvatar(p, s, x, y);
				});
				drawPlayerAvatar(p, playerX, playerY);

				// 팝업 애니메이션 렌더링
				game?.popups.forEach((popup) => {
					const studentIndex = game.students.findIndex(s => s.id === popup.studentId);
					if (studentIndex !== -1) {
						const [gx, gy] = STUDENT_TILES[studentIndex] ?? [5, 12];
						const { x, y } = slotToPixel(gx, gy);
						
						// 위로 떠오르는 애니메이션 (progress: 0 -> 1)
						const progress = 1 - (popup.life / popup.maxLife);
						const offsetY = -24 - (progress * 30);
						// 마지막 0.5초 동안 서서히 투명해짐
						const alpha = Math.min(255, (popup.life / 0.5) * 255);
						
						p.push();
						p.textAlign(p.CENTER, p.BOTTOM);
						p.textSize(10);
						// 가독성을 위한 하얀색 외곽선
						p.stroke(255, 255, 255, alpha);
						p.strokeWeight(2);
						p.fill(popup.color[0], popup.color[1], popup.color[2], alpha);
						p.text(popup.text, x + HEAD / 2, y + offsetY);
						p.pop();
					}
				});

				// 음표 애니메이션 렌더링
				musicalNotes.forEach(note => {
					p.push();
					p.textAlign(p.CENTER, p.BOTTOM);
					p.textSize(12);
					const alpha = Math.max(0, note.life / note.maxLife) * 255;
					p.fill(200, 100, 250, alpha);
					p.text(note.char, note.x, note.y);
					p.pop();
				});
			}

			if (uiScreen === 'title') {
				drawTitleOverlay(p);
			} else if (uiScreen === 'end' && game) {
				drawEndOverlay(p, game);
			}
			p.pop();

			if (feedback && p.millis() < feedbackUntil) {
				p.resetMatrix();
				p.fill(255, 220, 180);
				p.textAlign(p.CENTER, p.BOTTOM);
				p.textSize(9);
				p.text(feedback, W / 2, H - 8);
			}
		};

		function drawTitleOverlay(p) {
			p.fill(20, 28, 22, 200);
			p.rect(0, 0, W, ROWS * TILE);
			p.fill(...PALETTE.titleAccent);
			p.textAlign(p.CENTER, p.CENTER);
			p.textSize(14);
			p.text('CAFE FOCUS', W / 2, ROWS * TILE * 0.38);
			p.textSize(8);
			p.fill(...PALETTE.hudText);
			p.text('facilitator prototype', W / 2, ROWS * TILE * 0.48);
			p.textSize(7);
			p.text('Click to Start', W / 2, ROWS * TILE * 0.62);
			p.text('W: Window | M: Noise | Click: Remind', W / 2, ROWS * TILE * 0.72);
		}

		/** @param {import('../lib/cafeGame.js').CafeGame} g */
		function drawEndOverlay(p, g) {
			p.fill(18, 22, 18, 230);
			p.rect(0, 0, W, ROWS * TILE);
			p.fill(...PALETTE.hudText);
			p.textAlign(p.CENTER, p.TOP);
			p.textSize(12);
			const title = g.phase === 'won' ? 'CLEAR!' : 'GAME OVER';
			p.text(title, W / 2, ROWS * TILE * 0.22);
			p.textSize(7);
			const st = [
				`Completed ${g.getCompletedCount()} / ${g.students.length}`,
				`Remind ${g.summary.directRemindCount}  Noise ${g.summary.noiseChangeCount}  Window ${g.summary.windowOpenCount}`,
				endMessage,
				'Click / Key = Title',
			].join('\n');
			p.text(st, W / 2, ROWS * TILE * 0.38);
		}

		function startFromTitle() {
			game = new CafeGame();
			uiScreen = 'play';
			feedback = '';
			playerX = TILE * 10;
			playerY = TILE * 10;
			musicalNotes = [];
		}

		function backToTitle() {
			uiScreen = 'title';
			game = null;
			feedback = '';
		}

		p.mousePressed = () => {
			if (uiScreen === 'title') {
				startFromTitle();
				return;
			}
			if (uiScreen === 'end') {
				backToTitle();
				return;
			}
			if (!game || game.phase !== 'playing') return;

			const mx = p.mouseX;
			const my = p.mouseY - HUD_H;
			if (my < 0) return;

			for (let i = 0; i < game.students.length; i++) {
				const s = game.students[i];
				const [gx, gy] = STUDENT_TILES[i] ?? [5, 12];
				const { x, y } = slotToPixel(gx, gy);
				if (hitStudent(mx, my, s, x, y)) {
					const d = dist(playerX + HEAD/2, playerY + HEAD/2, x + HEAD/2, y + HEAD/2);
					if (d > INTERACT_RADIUS) {
						feedback = "Get closer!";
						feedbackUntil = p.millis() + 1000;
						return;
					}

					const r = game.remindStudent(s.id);
					if (!r.ok && r.reason) {
						feedback = r.reason;
						feedbackUntil = p.millis() + 900;
					}
					break;
				}
			}
		};

		p.keyPressed = () => {
			if (uiScreen === 'title') {
				startFromTitle();
				return;
			}
			if (uiScreen === 'end') {
				backToTitle();
				return;
			}
			if (!game || game.phase !== 'playing') return;
			const k = p.key;

			if (k === 'm' || k === 'M') {
				const speakerX = TILE * 2;
				const speakerY = (ROWS - 4) * TILE + TILE * 1.5;
				if (dist(playerX + HEAD/2, playerY + HEAD/2, speakerX, speakerY) > INTERACT_RADIUS + TILE) {
					feedback = "Get closer to speaker!";
					feedbackUntil = p.millis() + 1000;
					return;
				}
				game.cycleNoise();
			}
			
			if (k === 'w' || k === 'W') {
				const px = playerX + HEAD/2;
				if (px > TILE * 3 && px < W - TILE * 3) {
					feedback = "Get closer to window!";
					feedbackUntil = p.millis() + 1000;
					return;
				}
				game.openWindow();
			}
		};
	};

	const instance = new p5(sketch, host);
	return {
		remove: () => {
			instance.remove();
			if (typeof window !== 'undefined') {
				window.removeEventListener('keydown', preventScroll);
			}
		},
	};
}
