/**
 * 한 판 동안의 개입 기록 + 종료 시 reflection 문구 (표시 전용, 게임 규칙 없음)
 */

export class SessionSummary {
	constructor() {
		this.directRemindCount = 0;
		this.noiseChangeCount = 0;
		this.windowOpenCount = 0;
	}

	recordRemind() {
		this.directRemindCount += 1;
	}

	recordNoiseChange() {
		this.noiseChangeCount += 1;
	}

	recordWindow() {
		this.windowOpenCount += 1;
	}

	/** @param {{ completed: number, total: number }} end */
	getReflectionMessage(end) {
		const { completed, total } = end;
		const totalActions =
			this.directRemindCount + this.noiseChangeCount + this.windowOpenCount;

		if (completed >= 3 && this.noiseChangeCount >= this.directRemindCount) {
			return '전체 분위기를 차분하게 맞추는 데 신경 썼어요.';
		}
		if (this.directRemindCount >= 6) {
			return '어려워 보이는 학생에게 자주 손을 뻗었어요.';
		}
		if (this.windowOpenCount >= 3) {
			return '환기(창문)로 공간을 자주 리셋했어요.';
		}
		if (completed === total) {
			return '모든 학생이 목표에 가까이 갔어요. 균형 잡힌 퍼실리테이션이에요.';
		}
		if (totalActions <= 4) {
			return '개입은 적었지만, 타이밍이 중요했을 거예요.';
		}
		return '환경 조절과 개별 지원을 섞어서 써 본 한 판이에요.';
	}
}
