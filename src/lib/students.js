/**
 * @file students.js
 * @description 학생 모델 + 생성 패턴 (수업 예제: class, object, Factory + Builder, Singleton)
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 영역                                                            │
 * │ 1) 상수      — 자리 타일, 진행도 보정                          │
 * │ 2) Student   — 한 명의 상태·페르소나·틱·플레이어 액션 반응     │
 * │ 3) StudentBuilder — 체이닝으로 속성 조립 (내부 전용)            │
 * │ 4) StudentFactory — 싱글톤 + 프리셋 페르소나별 make* / 로스터  │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════
// 1) 상수 — 맵 자리 / 밸런스 (cafeGame.js 의 TOTAL_SECONDS 와 맞출 것)
// ═══════════════════════════════════════════════════════════════

/** p5에서 학생 아바타 자리(타일 col/row). `studentDraw.slotToPixel` 과 동일 순서 */
export const STUDENT_TILES = [
	[6, 6],
	[6, 10],
	[13, 8],
	[8, 15],
	[15, 17],
];

const MATCH_LENGTH_SEC = 100;
const PROGRESS_BASE_PER_SEC = 1.2 * (120 / MATCH_LENGTH_SEC);

// ═══════════════════════════════════════════════════════════════
// 2) Student — 인스턴스 = 객체(object). 메서드로 행동 캡슐화(class)
// ═══════════════════════════════════════════════════════════════

export class Student {
	/**
	 * @param {number} id  로스터 인덱스 (0..n-1). STUDENT_TILES[id] 와 대응
	 * @param {number} x   팩토리가 넣는 표시용 좌표 (렌더는 타일 기준)
	 * @param {number} y
	 */
	constructor(id, x, y) {
		// --- 식별·좌표 ---
		this.id = id;
		this.x = x;
		this.y = y;

		// --- 런타임 상태 (틱마다 변함) ---
		this.focus = 88;
		this.progress = 0;
		this.failed = false;
		this.remindCount = 0;

		// --- 페르소나 메타 (Factory + Builder가 설정) ---
		/** @type {'sensitive' | 'fast' | 'stable' | 'cold' | 'melodic'} */
		this.kind = 'stable';
		this.kindLabel = '안정형';

		// --- 틱(초당) 배율: 소음·창문과 곱해짐 ---
		/** 집중도 감소 배율 (높을수록 집중이 빨리 풀림) */
		this.decayMult = 1.0;
		/** 학습 속도 배율 (높을수록 과제 진행이 빠름) */
		this.progMult = 1.0;

		// --- 플레이어 액션별 즉시 집중 변화량 (페르소나마다 다른 조합) ---
		this.remindDelta = 10;
		this.windowOpenDelta = 5;
		this.windowCloseDelta = 0;
		this.noisePulseLouder = 5;
		this.noisePulseQuieter = 0;

		/** 최근 Remind 시각(게임 elapsed 초) — 연속 클릭(짜증) 판정용 */
		this.recentRemindTimes = [];
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

		if (this.focus > 28) {
			const gain = this.getProgressPerSecond(noiseLevel) * dt;
			this.progress = Math.min(100, this.progress + gain);
		}
	}

	getFocusDecayPerSecond(noiseLevel, windowOpen) {
		const noiseMap = { low: 0.75, normal: 1, high: 1.28 };
		const nMult = noiseMap[noiseLevel] || 1;

		let base = 1.02 * nMult;
		if (windowOpen) base *= 0.85;

		return base * this.decayMult;
	}

	getProgressPerSecond(noiseLevel) {
		const noiseMap = { low: 0.95, normal: 1, high: 1.04 };
		const nFactor = noiseMap[noiseLevel] || 1;
		return PROGRESS_BASE_PER_SEC * nFactor * this.progMult;
	}

	/**
	 * 직접 개입 (클릭 응원)
	 * @param {number} baseBonus (호환용, 현재 빌더 페르소나는 remindDelta 고정)
	 * @param {number} nowSec CafeGame.elapsed
	 * @param {{ windowSec: number, minCount: number }} burst 4초 안 minCount번이면 짜증
	 */
	applyRemindFocusDelta(baseBonus, nowSec, burst) {
		if (this.failed) return 0;

		const { windowSec, minCount } = burst;
		this.recentRemindTimes = this.recentRemindTimes.filter((t) => nowSec - t <= windowSec);
		this.recentRemindTimes.push(nowSec);

		let actualDelta = this.remindDelta;
		if (this.recentRemindTimes.length >= minCount) {
			actualDelta = -10;
		}

		this.focus = Math.max(0, Math.min(100, this.focus + actualDelta));
		this.remindCount += 1;
		return actualDelta;
	}

	applyWindowOpenDelta() {
		if (this.failed) return 0;
		this.focus = Math.max(0, Math.min(100, this.focus + this.windowOpenDelta));
		return this.windowOpenDelta;
	}

	applyWindowCloseDelta() {
		if (this.failed) return 0;
		this.focus = Math.max(0, Math.min(100, this.focus + this.windowCloseDelta));
		return this.windowCloseDelta;
	}

	applyNoiseEnvironmentPulse(type) {
		if (this.failed) return 0;
		const delta = type === 'louder' ? this.noisePulseLouder : this.noisePulseQuieter;
		this.focus = Math.max(0, Math.min(100, this.focus + delta));
		return delta;
	}

	getMoodEmoji() {
		if (this.failed) return '💤';
		if (this.focus > 30) return '🙂';
		if (this.focus > 15) return '😐';
		return '😫';
	}
}

// ═══════════════════════════════════════════════════════════════
// 3) StudentBuilder — 메서드 체이닝으로 Student 필드 단계 설정
// ═══════════════════════════════════════════════════════════════

class StudentBuilder {
	constructor(id, x, y) {
		this.student = new Student(id, x, y);
	}

	setKind(kind, label) {
		this.student.kind = kind;
		this.student.kindLabel = label;
		return this;
	}

	setMultipliers(decay, prog) {
		this.student.decayMult = decay;
		this.student.progMult = prog;
		return this;
	}

	setReactions(remind, winOpen, winClose, noiseL, noiseQ) {
		this.student.remindDelta = remind;
		this.student.windowOpenDelta = winOpen;
		this.student.windowCloseDelta = winClose;
		this.student.noisePulseLouder = noiseL;
		this.student.noisePulseQuieter = noiseQ;
		return this;
	}

	build() {
		return this.student;
	}
}

// ═══════════════════════════════════════════════════════════════
// 4) StudentFactory — Singleton(getFactory) + 프리셋 페르소나 생성
// ═══════════════════════════════════════════════════════════════

export class StudentFactory {
	static getFactory() {
		if (!StudentFactory.instance) {
			StudentFactory.instance = new StudentFactory();
		}
		return StudentFactory.instance;
	}

	/** [예민형] 소음에 약하고 환기에 매우 기뻐함. 개입하면 싫어함. */
	makeSensitive(id, x, y) {
		return new StudentBuilder(id, x, y)
			.setKind('sensitive', '예민형')
			.setMultipliers(1.22, 1.0)
			.setReactions(-15, 20, -10, -15, 10)
			.build();
	}

	/** [빠른형] 과제 속도가 빠르지만 집중력이 빨리 떨어짐. 개입을 환영함. 창문을 싫어함. */
	makeFast(id, x, y) {
		return new StudentBuilder(id, x, y)
			.setKind('fast', '빠른형')
			.setMultipliers(1.04, 1.4)
			.setReactions(10, -15, 5, 5, -5)
			.build();
	}

	/** [안정형] 변동에 둔감하고 묵묵히 공부함. 기본 수치. */
	makeStable(id, x, y) {
		return new StudentBuilder(id, x, y)
			.setKind('stable', '안정형')
			.setMultipliers(0.8, 0.9)
			.setReactions(15, 0, 0, 5, 0)
			.build();
	}

	/** [한랭민감형] 창문 열 때 추위·환기 스트레스, 닫히면 안도. 음악은 조용할 때 편함. */
	makeColdSensitive(id, x, y) {
		return new StudentBuilder(id, x, y)
			.setKind('cold', '한랭민감형')
			.setMultipliers(1.05, 1.05)
			.setReactions(5, -12, 12, -8, 6)
			.build();
	}

	/** [리듬형] 음악이 커질수록 몰입, 너무 조용하면 산만. 알림은 살짝 부담. */
	makeMelodic(id, x, y) {
		return new StudentBuilder(id, x, y)
			.setKind('melodic', '리듬형')
			.setMultipliers(1.1, 1.12)
			.setReactions(-8, 8, 0, 12, -10)
			.build();
	}

	/** @param {unknown[]} arr */
	_shuffleInPlace(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	/**
	 * 한 판에 등장하는 학생마다 서로 다른 페르소나(행동별 집중 델타 조합)를 갖도록 한다.
	 * count가 5 이하이면 중복 없이 배정하고, 그보다 크면 5종을 한 번씩 쓴 뒤 순환하며 중복이 생긴다.
	 * @param {number} [count=5]
	 */
	createRoster(count = 5) {
		const spacing = 118;
		const startX = 72;
		const y = 0;

		const makers = [
			(id, x, y) => this.makeSensitive(id, x, y),
			(id, x, y) => this.makeFast(id, x, y),
			(id, x, y) => this.makeStable(id, x, y),
			(id, x, y) => this.makeColdSensitive(id, x, y),
			(id, x, y) => this.makeMelodic(id, x, y),
		];

		const perm = makers.map((_, i) => i);
		this._shuffleInPlace(perm);

		const students = [];
		for (let i = 0; i < count; i++) {
			const ix = i < perm.length ? perm[i] : perm[i % perm.length];
			students.push(makers[ix](i, startX + i * spacing, y));
		}
		return students;
	}
}
