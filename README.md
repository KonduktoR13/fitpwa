# Силовой журнал PWA

PWA для быстрого ручного учета силовых подходов без тренировочных планов.

Публикация GitHub Pages:

https://konduktor13.github.io/fitpwa/

Локальная проверка:

```bash
npm install
npm run start
```

Production build:

```bash
npm run build
```

Автоматические тесты:

```bash
npm test
```

Локальный Coach Engine и принятые решения описаны в [docs/coach-engine-decision.md](docs/coach-engine-decision.md). Read-only replay пользовательского экспорта запускается явно с путём к JSON:

```bash
node scripts/replay-coach.mjs /path/to/training-log.json
```
