# Lessons

Skrócony, chronologiczny indeks najważniejszych wniosków i ustaleń wypracowanych
podczas pracy nad tym projektem. Pełne, szczegółowe opisy trzymaj w osobnych
plikach w `.ai/lessons/` i linkuj je stąd jedną linią.

Format wpisu:

```
## YYYY-MM-DD — krótki tytuł
Wniosek / ustalenie w 1-3 zdaniach. Odnośnik: [szczegóły](lessons/plik.md)
```

Zasady patrz `AGENTS.md` (sekcja "Katalog `.ai`").

<!-- Nowe wpisy dopisuj na dole pliku. -->

## 2026-10-18 — blok agent-rules Next.js w monorepo żyje przy aplikacji, nie w roocie
`next dev` utrzymuje zarządzany blok `<!-- BEGIN:nextjs-agent-rules -->` w
`AGENTS.md`/`CLAUDE.md` katalogu przekazanego jako argument (`next dev
packages/app`), nie w CWD repo. Po przejściu na monorepo blok trzeba ręcznie
przenieść do `packages/app/AGENTS.md`, inaczej root `AGENTS.md` zacznie
dryfować od tego, co faktycznie utrzymuje framework. Odnośnik:
[szczegóły](lessons/nextjs-agent-rules-monorepo.md)

## 2026-10-18 — MikroORM 7.2.5 w tym repo nie eksportuje dekoratorów encji
`@mikro-orm/core@7.2.5` nie eksportuje `@Entity`/`@PrimaryKey`/`@Property`
(potwierdzone: `node -e "console.log(require('@mikro-orm/core').Entity)"` →
`undefined`, i `tsc` daje `TS2305`/`TS2724`). Jedyne API do definiowania
encji w tej wersji to `defineEntity()` (property builders, `p.string()` itd.)
i `EntitySchema` — patrz `node_modules/@mikro-orm/core/entity/defineEntity.d.ts`
i przykład w `packages/db/src/entities/User.ts`. Nie zakładaj znajomości API
bibliotek z danych treningowych — tak jak z Next.js (patrz blok "Next.js w tym
repo" w `AGENTS.md`), w tym projekcie trzeba sprawdzać faktyczne eksporty w
`node_modules` przed napisaniem kodu.

## 2026-10-18 — `npm run build` wymaga `NODE_ENV=production` w tym środowisku
Sandbox ma globalnie ustawione `NODE_ENV=development` (Next.js ostrzega:
"non-standard NODE_ENV"). Przy takim NODE_ENV `next build` (zarówno Turbopack,
jak i `--webpack`) wywala się na prerenderingu stron z `TypeError: Cannot read
properties of null (reading 'useContext')` — ładuje dev-owy bundle React przy
statycznym eksporcie. Niezwiązane z monorepo/workspace'ami. Obejście:
`NODE_ENV=production npm run build`.
