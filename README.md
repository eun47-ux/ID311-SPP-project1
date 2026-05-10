# Cafe Focus Manager

## 1. Student Information
Name : Jieun Lee (20254499)
Email : wldms47@kaist.ac.kr



## 2. Source Code Repository
https://github.com/eun47-ux/ID311-SPP-project1



## 3. Demo Video




## 4. Game Description
Cafe Focus Manager is a simulation game where the player acts as a cafe facilitator (manager).  
Instead of directly controlling students, the player manages the cafe environment and gives small interventions to help students maintain focus and complete their study goals.

The core idea of the game is that different people react differently to the same environment.  
Some students work better in quiet spaces, while others become more productive with louder music or stimulation. Some students benefit from fresh air when the window is opened, while others dislike it. Likewise, reminding or encouraging a student can motivate certain students, but distract or annoy others.

Each run assigns five fixed persona archetypes (different reaction vectors to remind / window / music) in a shuffled order, so the same “type” never appears twice in one round. The player has to read who benefits from what, instead of one global best setting.


### Main Gameplay Features

- Move around the cafe using arrow keys
- Click students to “remind” them and recover their focus
- Change cafe noise level near the speaker area
- Open windows near the side walls for ventilation
- Manage different student personalities and reactions
- Observe how different students react differently to the same intervention
- Prevent students from burning out before time runs out

### Persona-Based Reactions

Each student is one of five persona presets (factory-built), with different preferences and sensitivities.

Examples include:
- students who focus better with loud music
- students who lose focus in noisy environments
- students who benefit from ventilation and fresh air
- students who dislike open windows
- students who become motivated when reminded
- students who feel interrupted or stressed by reminders

Because of these different reactions, the player’s role is not to optimize for one ideal condition, but to balance the needs of multiple students at once.

### Win / Lose Conditions

The round runs up to the full **100 seconds** (`GAME_CONFIG.TOTAL_SECONDS` in `src/lib/cafeGame.js`), **unless** the outcome is already fully determined earlier.

- **Everyone’s fate is fixed** = each student is either at **100%** (trophy) or **failed** (focus hit zero). As soon as that is true for all five, the round **ends immediately**: **CLEAR** if at least **three** are at 100%, otherwise **GAME OVER**. (Example: at ~90s, three trophies and two failures → **CLEAR** right away.)
- **Before** that “all decided” moment: **GAME OVER** immediately if at least **three** students have failed (`LOSE_FAIL_COUNT`).
- **When** time reaches zero without an early exit: same rule as “all decided” using current counts — at least **three** at 100% → **CLEAR**, else **GAME OVER**.

Student progress gain is scaled for the round length (see `MATCH_LENGTH_SEC` / `PROGRESS_BASE_PER_SEC` in `src/lib/students.js`).


## 5. 코드 구조 (정리 기준)

폴더를 **규칙(lib)** 과 **그리기(p5)** 로 나눴다. 수업에서 말한 것처럼 “데이터랑 규칙은 한쪽, 화면은 한쪽”에 두면 나중에 고치기 편하다.

```
src/
  lib/
    cafeGame.js    — 한 판 전체: 타이머, 승패, 소음/창문/Remind, 팝업
    students.js    — Student 클래스 + Factory/Builder + 자리 상수 STUDENT_TILES
    summary.js      — 개입 횟수 집계 + 엔드 한 줄 메시지

  p5/
    gameSketch.js   — p5 인스턴스: 타이틀/플레이/엔드, 입력, 거리 체크
    palette.js      — 색, TILE, 그리드
    cafeWorldDraw.js — 바닥·벽·테이블
    cafeHudDraw.js   — 상단 HUD
    studentDraw.js   — 학생/플레이어 스프라이트, 맞춤 히트박스

  App.svelte
  main.js
```

### 수업 내용이랑 연결해서 쓴 부분 (직접 짚을 때)

- **class / 객체**  
  - `Student`: 한 명의 상태(`focus`, `progress`, …)와 메서드(`tick`, `applyRemindFocusDelta` 등)를 묶은 인스턴스.  
  - `CafeGame`, `SessionSummary`: 한 판 세션·통계를 각각 클래스로 둠.  
  - `gameSketch` 안에서 `new CafeGame()`, `new p5(...)` 처럼 **생성자**로 붙이는 것도 같은 맥락.

- **if / 조건**  
  - `Student.tick`: `if (this.failed)`, `if (this.focus > 28)` 같이 **가드 + 분기**.  
  - `CafeGame`: 페이즈·쿨다운·창문 열림 여부 등 **여러 if**로 규칙 분기.  
  - `getFocusDecayPerSecond` 등에서 `noiseMap` **객체**를 키로 조회하고 `windowOpen`이면 배율 곱하는 식으로 수업 예제의 “상태에 따라 다르게”와 비슷하게 씀.

- **Factory + Builder + Singleton** (`ref/inclass tutorial.md` 의 ComputerFactory 예제랑 같은 뼈대)  
  - `StudentFactory.getFactory()`: **싱글톤** — 인스턴스 하나만 쓰게 static으로 막음.  
  - `StudentBuilder`: `setKind` → `setMultipliers` → `setReactions` → `build()` **체이닝**으로 `Student`를 조립.  
  - `makeSensitive`, `makeFast`, …: 프리셋 페르소나.  
  - `createRoster(n)`: 위 다섯 종을 **배열로 섞은 순서**에 맞춰 `n`명 생성 (한 판에 같은 페르소나 중복 없음, `n`이 5 넘으면 순환).  
  - 바깥에서는 **`new Student()`를 직접 부르지 않고** 팩토리만 거치게 해 둠.

- **자리 vs 페르소나**  
  - **자리**: `STUDENT_TILES` (타일 col/row) — `studentDraw`의 `slotToPixel`과 짝.  
  - **페르소나**: `Student`의 `kind` / `kindLabel` + 델타·배율 필드 — 전부 `StudentFactory` + `StudentBuilder`가 채움.

예전에 실험용으로 두었던 `studentPersona.js` / `rollPersona` 는 **실제 게임 경로에서 import 되지 않아서** 과제 제출용 코드 정리 때 제거했다. 지금 페르소나는 전부 `students.js` 안 프리셋으로만 간다.

### 모듈이 서로 만나는 방식

`lib/` 는 p5를 import 하지 않는다. `p5/gameSketch.js` 가 `CafeGame`을 만들고 `tick` / `remindStudent` 같은 메서드만 호출하고, 그리기는 `studentDraw`, `cafeWorldDraw` 등이 `game`과 `students`를 **읽기만** 한다. Svelte 쪽은 캔버스를 붙일 DOM만 넘긴다.





## 6. Highlights (Challenges and Design Decisions)

### 1. Difficulty Balancing

Balancing the game difficulty was one of the biggest challenges.

At first, study progress increased too quickly, so players could easily win without actively managing the cafe. Later, after reducing the progress speed, the opposite problem appeared: students lost focus too quickly and it became difficult to get enough students to finish before the timer ended.

The current version is intentionally designed to require active facilitation, but balancing focus decay, intervention effects, and progress speed required many iterations.


### 2. Persona-Based Reactions

A core design goal was making students react differently to the same intervention (remind / window / music pulse). Implementation-wise, each persona is a different tuple of deltas on the `Student` object, created through the factory + builder, and a full table of five never repeats within one round.



### 3. Preventing Repetitive Gameplay

Another challenge was preventing players from repeatedly using the same action without thinking.

To encourage observation and adaptation, the game includes systems where repeated direct interventions can eventually become less effective or even annoying for students.

The goal was to simulate the idea that facilitation requires understanding different people rather than endlessly applying the same solution.



### 4. Visual Direction Challenges

Finding the right visual direction was also difficult.

In the first prototype, the project mainly functioned as a dashboard-style simulation with minimal visuals. However, I wanted the game to feel more playful and game-like rather than purely informational.

To develop the visual style, I first created visual references and mood explorations using NanoBanana before implementing the final top-down cafe environment and pixel-style interactions.



### 5. System Complexity

Although the game appears simple, several systems interact simultaneously:
- focus decay
- study progress
- noise levels
- reminder reactions
- ventilation effects
- cooldown timing
- five persona presets (shuffled roster each run)

Making these systems feel understandable without becoming overwhelming required repeated tuning and simplification.




## 7. Acknowledgements

- Course materials and in-class examples (classes, `if`/`conditionals`, factory singleton + builder pattern from the tutorial notes)
- https://q5play.org/home/
- Google Fonts — Press Start 2P : for the retro UI typography.
- Reference images
  - 
배경 레퍼런스:
![background ref](references/background.png) : generated with nanobanana2
![character ref 1](references/character%20ref1.webp)
![character ref 2](references/character%20ref2.jpg)





## Running the project locally

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (often `http://localhost:8080`). For a production build:

```bash
npm run build
npm run start
```

The compiled assets are written to `public/build/`.
