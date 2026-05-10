/**
 * 한 판 카페 시뮬: 타이머, 소음·창문, 플레이어(퍼실리테이터) 액션, 승패
 */

import { StudentFactory } from './students.js';
import { SessionSummary } from './summary.js';

export const GAME_CONFIG = {
	TOTAL_SECONDS: 120,
	WIN_PROGRESS: 80,
	WIN_STUDENT_COUNT: 3,
	LOSE_FAIL_COUNT: 3,
	REMIND_COOLDOWN_SEC: 1.75,
	/** 같은 학생 Remind 시 순서대로 적용되는 보너스 */
	REMIND_FOCUS_BONUSES: [15, 10, 8, 6, 5],
	WINDOW_DURATION_SEC: 5,
};

/** @typedef {'low' | 'normal' | 'high'} NoiseLevel */

const NOISE_ORDER = /** @type {NoiseLevel[]} */ (['low', 'normal', 'high']);

export class CafeGame {
	constructor() {
		this.students = StudentFactory.createRoster(5);
		this.summary = new SessionSummary();
		this.remainingSeconds = GAME_CONFIG.TOTAL_SECONDS;
		/** @type {'playing' | 'won' | 'lost'} */
		this.phase = 'playing';
		/** @type {NoiseLevel} */
		this.noiseLevel = 'normal';
		this.windowSecondsLeft = 0;
		/** 마지막으로 어떤 개입이든 한 시각(초 단위 게임 경과) — Remind 쿨다운 */
		this.elapsed = 0;
		this.lastRemindAt = -999;
		/** @type {Array<{studentId: number, text: string, color: number[], life: number, maxLife: number}>} */
		this.popups = [];
	}

	/** @param {number} dt 초 */
	tick(dt) {
		if (this.phase !== 'playing') return;

		this.elapsed += dt;
		this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);
		if (this.windowSecondsLeft > 0) {
			this.windowSecondsLeft = Math.max(0, this.windowSecondsLeft - dt);
		}

		const windowOpen = this.windowSecondsLeft > 0;
		for (const s of this.students) {
			s.tick(dt, this.noiseLevel, windowOpen);
		}

		for (let i = this.popups.length - 1; i >= 0; i--) {
			this.popups[i].life -= dt;
			if (this.popups[i].life <= 0) {
				this.popups.splice(i, 1);
			}
		}

		this._resolveEnd();
	}

	_resolveEnd() {
		const completed = this.students.filter((s) => !s.failed && s.progress >= GAME_CONFIG.WIN_PROGRESS).length;
		const failed = this.students.filter((s) => s.failed).length;

		if (completed >= GAME_CONFIG.WIN_STUDENT_COUNT) {
			this.phase = 'won';
			return;
		}
		if (failed >= GAME_CONFIG.LOSE_FAIL_COUNT) {
			this.phase = 'lost';
			return;
		}
		if (this.remainingSeconds <= 0 && completed < GAME_CONFIG.WIN_STUDENT_COUNT) {
			this.phase = 'lost';
		}
	}

	/**
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

		const idx = Math.min(student.remindCount, GAME_CONFIG.REMIND_FOCUS_BONUSES.length - 1);
		const baseBonus = GAME_CONFIG.REMIND_FOCUS_BONUSES[idx];
		const actualDelta = student.applyRemindFocusDelta(baseBonus);
		this.lastRemindAt = this.elapsed;
		this.summary.recordRemind();
		if (actualDelta > 0) {
			this.addPopup(studentId, `+${actualDelta} Focus`, [100, 200, 100]);
		} else if (actualDelta < 0) {
			this.addPopup(studentId, `${actualDelta} Annoyed!`, [220, 80, 80]);
		}
		return { ok: true };
	}

	addPopup(studentId, text, colorRgb) {
		this.popups.push({
			studentId,
			text,
			color: colorRgb,
			life: 1.5,
			maxLife: 1.5
		});
	}

	cycleNoise() {
		if (this.phase !== 'playing') return;
		const i = NOISE_ORDER.indexOf(this.noiseLevel);
		this.noiseLevel = NOISE_ORDER[(i + 1) % NOISE_ORDER.length];
		this.summary.recordNoiseChange();

		for (const s of this.students) {
			if (this.noiseLevel === 'high') {
				if (s.kind === 'fast') this.addPopup(s.id, 'Speed UP!', [180, 100, 200]);
				else if (s.kind === 'sensitive') this.addPopup(s.id, 'Stress!!', [220, 80, 80]);
				else this.addPopup(s.id, 'Noisy', [200, 200, 200]);
			} else if (this.noiseLevel === 'low') {
				this.addPopup(s.id, 'Quiet...', [150, 150, 200]);
			} else {
				this.addPopup(s.id, 'Normal', [200, 200, 200]);
			}
		}
	}

	openWindow() {
		if (this.phase !== 'playing') return;
		if (this.windowSecondsLeft > 0) return;

		for (const s of this.students) {
			const delta = s.applyWindowBoost();
			if (delta > 0) {
				this.addPopup(s.id, `+${delta} Fresh`, [100, 180, 220]);
			} else if (delta < 0) {
				this.addPopup(s.id, `${delta} Cold!`, [100, 150, 250]);
			}
		}
		this.windowSecondsLeft = GAME_CONFIG.WINDOW_DURATION_SEC;
		this.summary.recordWindow();
	}

	getNoiseLabel() {
		const map = { low: '조용함', normal: '보통', high: '시끄움' };
		return map[this.noiseLevel];
	}

	getCompletedCount() {
		return this.students.filter((s) => !s.failed && s.progress >= GAME_CONFIG.WIN_PROGRESS).length;
	}

	getFailedCount() {
		return this.students.filter((s) => s.failed).length;
	}

	restart() {
		this.students = StudentFactory.createRoster(5);
		this.summary = new SessionSummary();
		this.remainingSeconds = GAME_CONFIG.TOTAL_SECONDS;
		this.phase = 'playing';
		this.noiseLevel = 'normal';
		this.windowSecondsLeft = 0;
		this.elapsed = 0;
		this.lastRemindAt = -999;
		this.popups = [];
	}
}
