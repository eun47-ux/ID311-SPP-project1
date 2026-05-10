/**
 * 학생 에이전트: 집중도·진행도·타입별 행동 (수업용 상속 + 팩토리)
 */

/** @typedef {'sensitive' | 'fast' | 'stable'} StudentKind */

export class Student {
	/**
	 * @param {number} id
	 * @param {StudentKind} kind
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(id, kind, x, y) {
		this.id = id;
		this.kind = kind;
		this.x = x;
		this.y = y;
		this.focus = 85;
		this.progress = 0;
		this.failed = false;
		/** 같은 학생에게 Remind 반복 시 감쇠용 */
		this.remindCount = 0;
	}

	/** @param {number} dt 초 */
	tick(dt, noiseLevel, windowOpen) {
		if (this.failed) return;

		const decay = this.getFocusDecayPerSecond(noiseLevel, windowOpen) * dt;
		this.focus = Math.max(0, this.focus - decay);

		if (this.focus <= 0) {
			this.failed = true;
			this.focus = 0;
			return;
		}

		if (this.focus > 30) {
			const gain = this.getProgressPerSecond(noiseLevel) * dt;
			this.progress = Math.min(100, this.progress + gain);
		}
	}

	/**
	 * @param {'low' | 'normal' | 'high'} noiseLevel
	 * @param {boolean} windowOpen
	 */
	getFocusDecayPerSecond(noiseLevel, windowOpen) {
		const noiseMult = { low: 0.72, normal: 1, high: 1.38 }[noiseLevel];
		let base = 1.15 * noiseMult;
		if (windowOpen) base *= 0.88;
		return base * this.decayTypeMultiplier();
	}

	/** @param {'low' | 'normal' | 'high'} noiseLevel */
	getProgressPerSecond(noiseLevel) {
		const n = { low: 0.92, normal: 1, high: 1.06 }[noiseLevel];
		return 0.85 * n * this.progressTypeMultiplier();
	}

	decayTypeMultiplier() {
		return 1;
	}

	progressTypeMultiplier() {
		return 1;
	}

	/** Remind 효과량 (감쇠는 CafeGame에서 보너스 배열로 적용) */
	applyRemindFocusDelta(delta) {
		if (this.failed) return 0;
		this.focus = Math.max(0, Math.min(100, this.focus + delta));
		this.remindCount += 1;
		return delta;
	}

	/** 창문 효과 */
	applyWindowBoost() {
		if (this.failed) return 0;
		const add = 0;
		this.focus = Math.max(0, Math.min(100, this.focus + add));
		return add;
	}

	/** UI용: 집중 상태 이모지 (MVP 문서 톤) */
	getMoodEmoji() {
		if (this.failed) return '💤';
		if (this.focus > 30) return '🙂';
		if (this.focus > 15) return '😐';
		return '😫';
	}

	getKindLabel() {
		const labels = { sensitive: '예민형', fast: '빠른형', stable: '안정형' };
		return labels[this.kind] ?? this.kind;
	}
}

export class SensitiveStudent extends Student {
	decayTypeMultiplier() {
		return 1.28;
	}

	progressTypeMultiplier() {
		return 0.95;
	}

	applyRemindFocusDelta(delta) {
		if (this.failed) return 0;
		const actualDelta = -15; // 싫어함
		this.focus = Math.max(0, Math.min(100, this.focus + actualDelta));
		this.remindCount += 1;
		return actualDelta;
	}

	applyWindowBoost() {
		if (this.failed) return 0;
		const add = 15; // 아주 좋아함
		this.focus = Math.max(0, Math.min(100, this.focus + add));
		return add;
	}
}

export class FastLearnerStudent extends Student {
	decayTypeMultiplier() {
		return 1;
	}

	progressTypeMultiplier() {
		return 1.35;
	}

	applyRemindFocusDelta(delta) {
		if (this.failed) return 0;
		const actualDelta = 5; // 조금 좋아함
		this.focus = Math.max(0, Math.min(100, this.focus + actualDelta));
		this.remindCount += 1;
		return actualDelta;
	}

	applyWindowBoost() {
		if (this.failed) return 0;
		const add = -10; // 싫어함
		this.focus = Math.max(0, Math.min(100, this.focus + add));
		return add;
	}

	getProgressPerSecond(noiseLevel) {
		const n = { low: 0.92, normal: 1, high: 1.12 }[noiseLevel];
		return 0.85 * n * this.progressTypeMultiplier();
	}
}

export class StableStudent extends Student {
	decayTypeMultiplier() {
		return 0.78;
	}

	progressTypeMultiplier() {
		return 0.82;
	}

	applyRemindFocusDelta(delta) {
		if (this.failed) return 0;
		const actualDelta = 15; // 아주 좋아함
		this.focus = Math.max(0, Math.min(100, this.focus + actualDelta));
		this.remindCount += 1;
		return actualDelta;
	}

	applyWindowBoost() {
		if (this.failed) return 0;
		const add = 0; // 반응 없음
		this.focus = Math.max(0, Math.min(100, this.focus + add));
		return add;
	}
}

const KINDS = /** @type {const} */ (['sensitive', 'fast', 'stable']);

/** @param {StudentKind} kind */
function createStudentInstance(id, kind, x, y) {
	if (kind === 'sensitive') return new SensitiveStudent(id, kind, x, y);
	if (kind === 'fast') return new FastLearnerStudent(id, kind, x, y);
	return new StableStudent(id, kind, x, y);
}

export const StudentFactory = {
	/** @returns {Student[]} */
	createRoster(count = 5) {
		const students = [];
		const spacing = 118;
		const startX = 72;
		const y = 0;
		for (let i = 0; i < count; i++) {
			const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
			students.push(createStudentInstance(i, kind, startX + i * spacing, y));
		}
		return students;
	},
};
