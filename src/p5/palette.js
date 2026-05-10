/**
 * Cozy retro / GameBoy 느낌 제한 팔레트 (p5 fill에 그대로 사용)
 */
export const PALETTE = {
	floorA: [235, 228, 216],
	floorB: [218, 208, 190],
	wall: [244, 238, 228],
	wallTrim: [92, 72, 58],
	table: [140, 98, 62],
	tableEdge: [72, 52, 40],
	chair: [120, 82, 52],
	counterTop: [232, 224, 210],
	counterBase: [88, 62, 48],
	plant: [96, 140, 88],
	plantPot: [120, 82, 55],
	hudBg: [48, 56, 48],
	hudText: [220, 230, 210],
	barTrack: [60, 68, 58],
	barFocus: [120, 170, 210],
	barProg: [150, 110, 190],
	skin: [248, 232, 210],
	hairBlack: [40, 35, 35],
	hairBrown: [110, 65, 40],
	hairBlonde: [230, 200, 110],
	shirt0: [200, 80, 80],   // Red
	shirt1: [80, 120, 200],  // Blue
	shirt2: [80, 180, 100],  // Green
	shirt3: [160, 100, 180], // Purple
	shirt4: [220, 140, 60],  // Orange
	outline: [42, 38, 34],
	titleAccent: [110, 150, 100],
	/** 플레이어 머리 위 ▼ 마커 (studentDraw.js drawPlayerAvatar) */
	playerMarker: [255, 210, 48],
	/** 화면 하단 Get closer 등 안내 문구 (gameSketch.js feedback) — 밝은 바닥 위 대비용 짙은 갈색 */
	feedbackHint: [78, 48, 34],
};

export const TILE = 16;
export const COLS = 22;
export const ROWS = 22;

/** @param {number} v */
export function snap(v) {
	return Math.round(v / TILE) * TILE;
}
