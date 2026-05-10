/**
 * @file cafeGame.js
 * @description 한 판(CafeGame)의 규칙만 담당한다. p5/Svelte는 여기를 호출만 하고 그리지 않는다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 읽는 순서 제안                                                  │
 * │ 1) GAME_CONFIG  — 승패·시간·쿨다운 숫자                        │
 * │ 2) constructor  — 학생·요약 객체가 어떻게 붙는지               │
 * │ 3) tick         — 매 프레임: 시간, 학생 tick, 팝업, 승패 검사   │
 * │ 4) 플레이어 액션 — remindStudent / cycleNoise / openWindow     │
 * │ 5) restart      — 새 세션                                     │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 플레이어(퍼실리테이터)가 건드리는 진입점은 세 가지뿐이다.
 *   · remindStudent(id) — 학생 클릭 응원 (거리는 p5에서 검사)
 *   · cycleNoise()      — 음악 M: low(꺼짐) ↔ normal(켜짐) 토글 (호출 전 스피커 근접은 p5)
 *   · openWindow()      — 창문·환기 (호출 전 위치는 p5)
 */

import { StudentFactory } from './students.js';
import { SessionSummary } from './summary.js';

// ─────────────────────────────────────────────────────────────
// 상수 (밸런스 튜닝은 여기만 보면 됨)
// ─────────────────────────────────────────────────────────────

export const GAME_CONFIG = {
	/** 한 판 제한 시간(초) */
	TOTAL_SECONDS: 100,
	/** 이 진행도(%) 이상이면 “완료”로 센다 */
	WIN_PROGRESS: 100,
	/** 트로피(100%) 인원이 이 수 이상이면 CLEAR(시간 종료 시 또는 전원 운명 확정 시) */
	WIN_STUDENT_COUNT: 3,
	/** 집중 0으로 실패한 학생이 이 수 이상이면 패배 */
	LOSE_FAIL_COUNT: 3,
	/** 응원(Remind) 후 다시 쓰기까지 최소 간격(초) */
	REMIND_COOLDOWN_SEC: 1.75,
	/** 응원 시 기본 보정값; 같은 학생에게 반복할수록 목록 뒤로 갈수록 작아짐 (실제 적용은 persona가 곱함) */
	REMIND_FOCUS_BONUSES: [15, 10, 8, 6, 5],
	/** 같은 학생 Remind: 이 시간(초) 안에 이 횟수 이상이면 짜증(음수). 그 밖은 페르소나 remindDelta 유지 */
	REMIND_BURST_WINDOW_SEC: 4,
	REMIND_BURST_MIN_COUNT: 3,
	/** 창문 연 상태 유지 시간(초) */
	WINDOW_DURATION_SEC: 5,
};

/** 화면에 뜨는 짧은 피드백 말풍선 지속 시간(초) — addPopup */
const POPUP_DURATION_SEC = 1.5;

/** @typedef {'low' | 'normal' | 'high'} NoiseLevel */

// ─────────────────────────────────────────────────────────────
// CafeGame — 한 판의 상태 기계
// ─────────────────────────────────────────────────────────────

export class CafeGame {
	constructor() {
		this.students = StudentFactory.getFactory().createRoster(5);
		this.summary = new SessionSummary();

		this.remainingSeconds = GAME_CONFIG.TOTAL_SECONDS;
		/** @type {'playing' | 'won' | 'lost'} */
		this.phase = 'playing';

		/** @type {NoiseLevel} low=음악 꺼짐, normal=켜짐(M 토글, HUD ON/OFF) */
		this.noiseLevel = 'low';

		/** 창문 “열림” 남은 시간(초). 0이면 닫힌 상태 */
		this.windowSecondsLeft = 0;

		/** 게임 시작 후 경과 시간(초). Remind 쿨다운 계산에 사용 */
		this.elapsed = 0;
		this.lastRemindAt = -999;

		/**
		 * 학생 머리 위 짧은 텍스트 (p5가 그림)
		 * @type {Array<{ studentId: number, text: string, color: number[], life: number, maxLife: number }>}
		 */
		this.popups = [];

		/** 승리 확정 시점까지 경과 시간(초). 미승리면 null */
		this.winDurationSec = null;
	}

	// ─── 시뮬레이션 루프 (매 프레임 1회) ───

	/**
	 * 시간 감소 → 학생들 tick → 팝업 수명 → 승패 판정
	 * @param {number} dt 초
	 */
	tick(dt) {
		if (this.phase !== 'playing') return;

		this.elapsed += dt;

		const timeBefore = this.remainingSeconds;
		this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);
		/** 남은 제한 시간이 닿을 때까지만 학생 시뮬(진행도·집중) — 0 이후에는 진행이 더 올라가 승리가 비는 일 방지 */
		const simDt = timeBefore > 0 ? Math.min(dt, timeBefore) : 0;

		const wasWindowOpen = this.windowSecondsLeft > 0;
		if (this.windowSecondsLeft > 0) {
			this.windowSecondsLeft = Math.max(0, this.windowSecondsLeft - dt);
		}
		const windowOpen = this.windowSecondsLeft > 0;

		if (wasWindowOpen && !windowOpen) {
			for (const s of this.students) {
				if (s.hasClearedGoal()) continue;
				const d = s.applyWindowCloseDelta();
				if (d > 0) {
					this.addPopup(s.id, `+${d} Closed`, [140, 200, 160]);
				} else if (d < 0) {
					this.addPopup(s.id, `${d} Stuffy`, [200, 120, 90]);
				} else {
					this.addPopup(s.id, '…', [160, 160, 160]);
				}
			}
		}
		for (const s of this.students) {
			s.tick(simDt, this.noiseLevel, windowOpen);
		}

		for (let i = this.popups.length - 1; i >= 0; i--) {
			this.popups[i].life -= dt;
			if (this.popups[i].life <= 0) {
				this.popups.splice(i, 1);
			}
		}

		this._resolveEnd();
	}

	/**
	 * 승·패 (한 판에 한 번만 확정)
	 *
	 * - 기본은 **남은 시간이 0**(100초 경과)까지 플레이.
	 * - **전원 운명이 확정된 순간**(각 학생이 트로피(100%) 또는 집중 0 실패 중 하나)이면, 그 즉시 판정:
	 *   트로피 `WIN_STUDENT_COUNT`명 이상이면 CLEAR, 아니면 GAME OVER. (예: 3 트로피 + 2 실패 → 즉시 CLEAR)
	 * - 집중 0 실패가 `LOSE_FAIL_COUNT`명 이상이면 즉시 GAME OVER(전원 확정 전에도).
	 * - 시간이 먼저 0이 되면: 트로피 인원으로 위와 동일하게 CLEAR / GAME OVER.
	 */
	_resolveEnd() {
		const completed = this.students.filter((s) => s.hasClearedGoal()).length;
		const failed = this.students.filter((s) => s.failed).length;
		const need = GAME_CONFIG.WIN_STUDENT_COUNT;
		const timeUp = this.remainingSeconds <= 0;
		const allFatesDecided = this.students.every((s) => s.hasClearedGoal() || s.failed);

		if (failed >= GAME_CONFIG.LOSE_FAIL_COUNT) {
			this.phase = 'lost';
			return;
		}

		if (allFatesDecided) {
			if (completed >= need) {
				if (this.winDurationSec === null) {
					this.winDurationSec = this.elapsed;
				}
				this.phase = 'won';
			} else {
				this.phase = 'lost';
			}
			return;
		}

		if (timeUp) {
			if (completed < need) {
				this.phase = 'lost';
				return;
			}
			if (this.winDurationSec === null) {
				this.winDurationSec = this.elapsed;
			}
			this.phase = 'won';
			return;
		}
	}

	// ─── 플레이어 액션 (UI/p5에서만 호출) ───

	/**
	 * [액션 1] 학생에게 응원(Remind)
	 * - 집중 변화는 페르소나 remindDelta; 같은 학생에게 4초 안에 3번 연속 Remind면 음수(짜증)
	 * @param {number} studentId
	 * @returns {{ ok: boolean, reason?: string }}
	 */
	remindStudent(studentId) {
		if (this.phase !== 'playing') return { ok: false, reason: '종료됨' };
		if (this.elapsed - this.lastRemindAt < GAME_CONFIG.REMIND_COOLDOWN_SEC) {
			return { ok: false, reason: '쿨다운' };
		}

		const student = this.students.find((s) => s.id === studentId);
		if (!student || student.failed) return { ok: false, reason: '대상 없음' };
		if (student.hasClearedGoal()) return { ok: false };

		const idx = Math.min(student.remindCount, GAME_CONFIG.REMIND_FOCUS_BONUSES.length - 1);
		const baseBonus = GAME_CONFIG.REMIND_FOCUS_BONUSES[idx];
		const actualDelta = student.applyRemindFocusDelta(baseBonus, this.elapsed, {
			windowSec: GAME_CONFIG.REMIND_BURST_WINDOW_SEC,
			minCount: GAME_CONFIG.REMIND_BURST_MIN_COUNT,
		});

		this.lastRemindAt = this.elapsed;
		this.summary.recordRemind();

		if (actualDelta > 0) {
			this.addPopup(studentId, `+${actualDelta} Focus`, [100, 200, 100]);
		} else if (actualDelta < 0) {
			this.addPopup(studentId, `${actualDelta} Annoyed!`, [220, 80, 80]);
		} else {
			this.addPopup(studentId, '…', [160, 160, 160]);
		}
		return { ok: true };
	}

	/**
	 * [액션 2] 음악(M): 직전 상태 기준 토글 — 켜져 있으면 OFF, 꺼져 있으면 ON
	 * - tick 배율 외에, 바꾼 순간 페르소나별 즉시 집중 변화(louder / quieter 펄스)
	 */
	cycleNoise() {
		if (this.phase !== 'playing') return;

		const wasOn = this.isMusicOn();
		let loudening = false;
		let quietening = false;

		if (wasOn) {
			this.noiseLevel = 'low';
			quietening = true;
		} else {
			this.noiseLevel = 'normal';
			loudening = true;
		}

		this.summary.recordNoiseChange();

		for (const s of this.students) {
			if (s.hasClearedGoal()) continue;
			let d = 0;
			if (loudening) {
				d = s.applyNoiseEnvironmentPulse('louder');
				if (d > 0) {
					this.addPopup(s.id, `+${d} Beat`, [120, 180, 220]);
				} else if (d < 0) {
					this.addPopup(s.id, `${d} Ugh`, [220, 90, 90]);
				} else {
					this.addPopup(s.id, '~', [150, 150, 150]);
				}
			} else if (quietening) {
				d = s.applyNoiseEnvironmentPulse('quieter');
				if (d > 0) {
					// 예전에 소음에 Ugh였던 쪽 — 조용해지면 집중 회복
					this.addPopup(s.id, `+${d} Can focus!`, [100, 200, 130]);
				} else if (d < 0) {
					this.addPopup(s.id, `${d} Too quiet`, [200, 110, 100]);
				} else {
					this.addPopup(s.id, '~', [150, 150, 150]);
				}
			}
		}
	}

	/**
	 * [액션 3] 창문 열기 (환기)
	 * - 이미 열려 있으면 무시
	 * - 열 때 applyWindowOpenDelta, 닫힐 때 tick 안 applyWindowCloseDelta 로 즉시 집중 변화
	 */
	openWindow() {
		if (this.phase !== 'playing') return;
		if (this.windowSecondsLeft > 0) return;

		for (const s of this.students) {
			if (s.hasClearedGoal()) continue;
			const delta = s.applyWindowOpenDelta();
			if (delta > 0) {
				this.addPopup(s.id, `+${delta} Fresh`, [100, 180, 220]);
			} else if (delta < 0) {
				this.addPopup(s.id, `${delta} Cold!`, [100, 150, 250]);
			} else {
				this.addPopup(s.id, 'Air ok', [170, 170, 170]);
			}
		}

		this.windowSecondsLeft = GAME_CONFIG.WINDOW_DURATION_SEC;
		this.summary.recordWindow();
	}

	// ─── 피드백 (액션에서만 채움, tick에서 수명 감소) ───

	/**
	 * @param {number} studentId
	 * @param {string} text
	 * @param {[number, number, number]} colorRgb
	 */
	addPopup(studentId, text, colorRgb) {
		this.popups.push({
			studentId,
			text,
			color: colorRgb,
			life: POPUP_DURATION_SEC,
			maxLife: POPUP_DURATION_SEC,
		});
	}

	// ─── 조회 (HUD·종료 화면) ───

	/** HUD용: 음악이 켜져 있으면 true (M 토글 시 normal; low만 꺼짐) */
	isMusicOn() {
		return this.noiseLevel !== 'low';
	}

	getCompletedCount() {
		return this.students.filter((s) => s.hasClearedGoal()).length;
	}

	getFailedCount() {
		return this.students.filter((s) => s.failed).length;
	}

	// ─── 재시작 ───

	restart() {
		this.students = StudentFactory.getFactory().createRoster(5);
		this.summary = new SessionSummary();
		this.remainingSeconds = GAME_CONFIG.TOTAL_SECONDS;
		this.phase = 'playing';
		this.noiseLevel = 'low';
		this.windowSecondsLeft = 0;
		this.elapsed = 0;
		this.lastRemindAt = -999;
		this.popups = [];
		this.winDurationSec = null;
	}
}
