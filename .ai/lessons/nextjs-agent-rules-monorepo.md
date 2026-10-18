# Blok agent-rules Next.js w monorepo

## Ustalenie

`node_modules/next/dist/server/lib/start-server.js` woła
`ensureAgentRulesForDev(dir)` (z `node_modules/next/dist/server/lib/
app-info-log.js`), gdzie `dir` to katalog, z którego faktycznie serwowana jest
aplikacja — czyli argument przekazany do `next dev <dir>`, a **nie**
`process.cwd()` repozytorium.

`ensureAgentRulesForDev` → `hasCurrentAgentRules(dir)` /
`writeAgentFiles(dir)` z `node_modules/next/dist/server/lib/
generate-agent-files.js` czytają/piszą `AGENTS.md` i `CLAUDE.md` w `dir`, nie
gdzie indziej.

## Konsekwencja dla monorepo

Jeśli `next dev` jest uruchamiane jako `next dev packages/app` (standardowy
sposób odpalania Next.js z podkatalogu monorepo), zarządzany blok
`<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` będzie
utrzymywany w `packages/app/AGENTS.md` (i `packages/app/CLAUDE.md`, jeśli
żaden z plików jeszcze nie istnieje — wtedy `next dev` tworzy oba naraz, tak
jak `create-next-app`).

Root `AGENTS.md` nie jest już przez framework dotykany. Jeśli zostawi się tam
stary blok, z czasem rozjedzie się z wersją faktycznie generowaną przez
zainstalowaną wersję Next.js (treść bloku bywa aktualizowana między wersjami
Next).

## Co zrobić przy przechodzeniu na monorepo

1. Przenieść istniejący blok z root `AGENTS.md` do `packages/<app>/AGENTS.md`
   dokładnie 1:1 (markery + treść), żeby pierwsze uruchomienie `next dev` nie
   zobaczyło różnicy i nie zrobiło niepotrzebnego zapisu.
2. Utworzyć `packages/<app>/CLAUDE.md` z zawartością `@AGENTS.md` (to, co
   `writeAgentFiles` tworzy, gdy żaden z plików jeszcze nie istnieje).
3. W root `AGENTS.md` zostawić krótki odnośnik do `packages/<app>/AGENTS.md`
   zamiast duplikować treść.

Zweryfikowano na Next.js 16.3.4 — przy aktualizacji Next.js sprawdzić, czy
`buildAgentRulesBlock()` w `generate-agent-files.js` się nie zmieniło.
