/**
 * Per-run intervention counts + short end-of-run reflection line (display only).
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

	/**
	 * @param {{ completed: number, total: number, goalStudentCount: number, winSec?: number|null }} end
	 */
	getReflectionMessage(end) {
		const { completed, total, goalStudentCount, winSec } = end;
		const totalActions =
			this.directRemindCount + this.noiseChangeCount + this.windowOpenCount;

		let msg;
		if (completed >= goalStudentCount && this.noiseChangeCount >= this.directRemindCount) {
			msg = 'You leaned on calmer room tone (music) often.';
		} else if (this.directRemindCount >= 6) {
			msg = 'You checked in on students directly, a lot.';
		} else if (this.windowOpenCount >= 3) {
			msg = 'You reset the space with fresh air often.';
		} else if (completed === total) {
			msg = 'Everyone neared the goal. Balanced facilitation.';
		} else if (totalActions <= 4) {
			msg = 'Few moves—timing probably mattered most.';
		} else {
			msg = 'You mixed environment tweaks with nudges this run.';
		}

		if (winSec != null && Number.isFinite(winSec)) {
			msg = `${msg}\nClear time: ${winSec.toFixed(1)}s`;
		}
		return msg;
	}
}
