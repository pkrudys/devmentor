# Next.js w tym repo

To monorepo, a aplikacja Next.js mieszka w `packages/app/`. Zarządzany przez
`next dev` blok zasad dla agentów (ostrzeżenie o breaking changes i
dokumentacji w `node_modules/next/dist/docs/`) jest utrzymywany **tam**, nie
tutaj — zobacz `packages/app/AGENTS.md` zanim zaczniesz edytować kod tego
pakietu. Powód: `next dev packages/app` wywołuje generator bloku względem
katalogu podanego jako argument, nie względem roota repo. Szczegóły:
[[nextjs-agent-rules-monorepo]] w `.ai/lessons/`.

# Stack i architektura DevMentor

DevMentor to monorepo (npm workspaces) z pakietami w `packages/*`, w scope
`@devmentor/*`:

- **`packages/app`** (`@devmentor/app`) — Next.js (App Router) + TypeScript +
  React. Strony, routing, kompozycja, server actions. Jedyny pakiet, który się
  deployuje.
- **`packages/core`** (`@devmentor/core`) — logika domenowa, kontener
  Dependency Injection ([Awilix](https://github.com/jeffijoe/awilix)) i
  warstwa HTTP wielokrotnego użytku (`src/http/`). Nowe zależności DI
  rejestruj w `withScope.ts`/`container.ts` i dodawaj do typu `Cradle`
  (`src/container/cradle.ts`).
- **`packages/db`** (`@devmentor/db`) — dostęp do danych: encje
  [MikroORM](https://mikro-orm.io/) (PostgreSQL) przez `defineDomainEntity()`,
  konfiguracja połączenia i pula połączeń. Migracje CLI i docker-compose dla
  lokalnego Postgresa są świadomie jeszcze nieskonfigurowane — dev używa
  `npm run db:sync-schema -w @devmentor/db` (patrz specyfikacje w
  `.ai/specs/implemented/`).
- **`packages/ui`** (`@devmentor/ui`) — komponenty UI wielokrotnego użytku:
  [shadcn-ui](https://ui.shadcn.com/) (głównie dla stron/paneli backendowych)
  na [Tailwind CSS](https://tailwindcss.com/) (stylowanie stron frontendowych).
  Tailwind sam w sobie jest skonfigurowany tylko w `packages/app` — `ui` jest
  skanowany przez `@source` w `packages/app/src/app/globals.css`.

Zasada przydziału kodu: logika domenowa/DI → `core`, dostęp do danych/encje →
`db`, komponenty UI → `ui`, strony/routing/kompozycja → `app`. Pakiety
importowane są bezpośrednio jako źródła TypeScript (`"main": "./src/index.ts"`)
— Turbopack transpiluje pakiety workspace'u automatycznie, więc `core`/`db`/`ui`
nie potrzebują własnego kroku builda.

Uruchamianie całego projektu — zawsze z roota repozytorium:

```bash
npm install
npm run dev
```

## Konwencja konceptów domenowych

Kod domenowy nie jest organizowany w `modules/`. Każdy koncept (`auth`,
`mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`,
`reviews`, ...) to folder o tej samej nazwie powtarzany w warstwach, które go
potrzebują:

- `packages/db/src/entities/<concept>/<name>.entity.ts` (przez
  `defineDomainEntity()` z `entities/define.ts`)
- `packages/core/src/services/<concept>/<name>.service.ts`
- `packages/core/src/validators/<concept>/` (współdzielone schematy zod, gdy
  potrzebne)
- `packages/app/src/app/api/<concept>/route.ts` i odpowiadający `page.tsx` pod
  właściwą grupą tras (persona)

Folder konceptu powstaje dopiero przy jego pierwszym pliku — nigdy nie
scaffolduj pustych. To konwencja katalogowa, nie runtime modułów: nie ma
per-konceptowego setup/ACL/auto-discovery. Pełna tabela nazewnictwa i wzorce
port/event-emitter: `.ai/docs/engineering-standards.md`.

ID zdarzeń ma format `concept.entity.action` (np. `bookings.booking.created`)
i są emitowane przez typowany emitter w `packages/core/src/events`,
zarejestrowany w `Cradle` — to wyłącznie in-process, bez kolejki/workera w tym
projekcie (jeszcze nieistniejące — dodawane dopiero przy pierwszej funkcji,
która tego potrzebuje).

## Warstwa reużywalna API i UI

Każda trasa i każda strona reużywa dwóch wspólnych warstw zamiast odtwarzać
fetch/walidację/auth/obsługę błędów per funkcja:

- `packages/core/src/http/` — `errors.ts` (typowana hierarchia `AppError`),
  `apiHandler.ts` (owija trasę: łapie `AppError`/`ZodError`, mapuje na status +
  kopertę JSON, sprawdza nagłówek CSRF na non-GET, loguje nieoczekiwane błędy),
  `makeCrudRoute.ts` (schemat + serwis → `{ GET, POST, PUT, DELETE }` dla
  prostych zasobów CRUD), `auth.ts` (`requireSession`, `requireRole`, JWT w
  httpOnly cookie).
- `packages/ui/src/backend/` — `api/apiCall.ts` (jedyne dozwolone miejsce na
  `fetch('/api/*')`, zawsze z nagłówkiem CSRF), `forms/CrudForm.tsx`
  (formularz sterowany schematem zod), `tables/DataTable.tsx` (lista sterowana
  konfiguracją kolumn), `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`.

**Ważne dla komponentów klienckich (`'use client'`):** importuj z
`@devmentor/core` tylko przez dedykowane podścieżki (np.
`@devmentor/core/validators/auth/user-create.schema`), nigdy przez barrel
`@devmentor/core` — barrel re-eksportuje też kod server-only (MikroORM,
serwisy), który nie zbuduje się dla przeglądarki. Zobacz
[[client-server-barrel-imports]] w `.ai/lessons/`.

Nowy reużywalny komponent ma jeden docelowy dom:

1. Surowy prymityw shadcn (bez logiki) → `ui/src/components/ui/`, tylko przez
   `npx shadcn@latest add <nazwa>` — nigdy ręcznie pisany.
2. Generyczny, konceptowo-agnostyczny wzorzec panelu → `ui/src/backend/<kategoria>/`.
3. Komponent przypisany do jednego konceptu → `ui/src/components/<concept>/`,
   nazwany jak folder konceptu w `db`/`core`.
4. Komponent używany przez dokładnie jedną stronę → kolokuj obok `page.tsx`,
   wydziel dopiero gdy pojawi się drugi konsument.

Pełne uzasadnienie (SRP/DRY/dependency-inversion) i referencyjny przykład
(`auth`/`User`): `.ai/docs/engineering-standards.md` oraz
`.ai/specs/implemented/2026-10-18-engineering-standards-foundation.md`.

# Katalog `.ai` — specyfikacje, logi przebiegów i lekcje

Ten projekt trzyma w katalogu `.ai/` trzy rodzaje trwałej wiedzy roboczej. **Każdy
agent (LLM) pracujący w tym repozytorium musi z niego korzystać zgodnie z poniższymi
zasadami** — to nie jest opcjonalna dokumentacja, tylko wymagany workflow.

```
.ai/
  specs/              specyfikacje w toku (SDD)
    implemented/       specyfikacje już zrealizowane
    archive/           specyfikacje porzucone / nieaktualne
  runs/               logi autonomicznych przebiegów AI
  lessons.md          skrócony indeks wniosków i ustaleń
  lessons/            szczegółowe pliki z lekcjami (po jednym na temat)
```

## `.ai/specs/` — specyfikacje (Spec-Driven Development)

- Każdą nietrywialną funkcję, refaktor albo zmianę zaczynamy od specyfikacji,
  **zanim** powstanie kod (podejście Spec-Driven Development).
- Nazwa pliku specyfikacji ma format `YYYY-MM-DD-slug.md`, np.
  `2026-10-18-user-auth-refactor.md`.
- Specyfikacje w toku / zaplanowane leżą bezpośrednio w `.ai/specs/`.
- Po zrealizowaniu specyfikacji (wdrożony i zmergowany kod) przenieś plik do
  `.ai/specs/implemented/`, zachowując oryginalną nazwę.
- Specyfikację porzuconą lub zastąpioną inną przenoś do `.ai/specs/archive/`
  zamiast ją usuwać — ma zostać ślad decyzji.
- **Zasada wymuszona:** przed rozpoczęciem nietrywialnego zadania sprawdź
  `.ai/specs/` i `.ai/specs/implemented/`, czy nie istnieje już powiązana
  specyfikacja. Jeśli nie istnieje, a zadanie tego wymaga — utwórz ją najpierw
  i dopiero potem implementuj.

## `.ai/runs/` — logi autonomicznych przebiegów

- Każdy autonomiczny przebieg AI (np. pętla agenta, automatyzacja, dłuższe
  samodzielne zadanie bez bieżącego nadzoru człowieka) ma zostawić log.
- Nazwa pliku w formacie `YYYY-MM-DD-slug.md`, np. `2026-10-18-fix-build.md`.
- Log powinien zawierać: cel przebiegu, podjęte kroki/decyzje, wynik oraz
  odnośniki do commitów/PR-ów.
- **Zasada wymuszona:** na początku autonomicznego przebiegu utwórz plik logu
  w `.ai/runs/` i aktualizuj go w trakcie pracy, tak aby przebieg dało się
  później odtworzyć i zweryfikować.

## `.ai/lessons.md` i `.ai/lessons/` — lekcje i długoterminowa pamięć

- `.ai/lessons.md` to krótki, chronologiczny indeks najważniejszych wniosków
  (po kilka zdań na wpis, z linkiem do szczegółów).
- `.ai/lessons/` to katalog na szczegółowe pliki per temat (np.
  `.ai/lessons/flaky-tests.md`), linkowane z `lessons.md`.
- **Zasada wymuszona:**
  - Przed rozpoczęciem pracy nad zadaniem zajrzyj do `.ai/lessons.md` (i
    powiązanych plików w `.ai/lessons/`), żeby nie powtarzać już poznanych
    błędów.
  - Po naprawieniu błędu, rozwiązaniu nietrywialnego problemu albo odkryciu
    czegoś, co warto zapamiętać na przyszłość, dopisz wpis do `.ai/lessons.md`
    (i w razie potrzeby osobny plik w `.ai/lessons/` ze szczegółami) — zamiast
    pozwolić, by ta wiedza przepadła.
  - Jeśli poprawka ujawnia **ogólną zasadę**, która powinna trwale zmienić
    zachowanie agenta (nie tylko fakt dotyczący jednego zdarzenia), dopisz ją
    zwięźle do `AGENTS.md` — `lessons.md` to dziennik wniosków,
    `AGENTS.md` to egzekwowane reguły.

# Dobre praktyki pracy z Claude Code (wg wskazówek Borisa Cherny'ego)

Wybrane z [10 Claude Code tips from Boris](https://ykdojo.github.io/claude-code-tips/content/boris-claude-code-tips),
dopasowane do zasad powyżej (bez ich duplikowania).

## Planowanie złożonych zadań

- Każde złożone zadanie (zmiana wieloplikowa, refaktor, nowa funkcja) zaczynaj
  od planu, zanim napiszesz kod — użyj trybu planowania (Plan Mode) i dopracuj
  plan tak, żeby implementacja mogła powstać "za jednym podejściem".
- Jeśli w trakcie implementacji coś zaczyna się sypać, wróć do planowania
  zamiast brnąć dalej impetem.
- Dla zadań opartych na specyfikacji z `.ai/specs/` plan musi być z nią
  spójny; rozbieżności odnotuj w specyfikacji przed kontynuowaniem.

## Weryfikacja zmian

- Zanim uznasz zadanie za zakończone: uruchom testy/lint/build i przejrzyj
  diff — nie opieraj się tylko na przekonaniu, że kod "powinien działać".
- W niejednoznacznych przypadkach samodzielnie skrytykuj własne rozwiązanie
  (przypadki brzegowe, alternatywne podejścia) zanim zaproponujesz je jako
  gotowe, zamiast od razu zgłaszać zadanie jako ukończone.
- Jeśli pierwsze podejście jest tylko "działające", a nie eleganckie,
  rozważ świadome przepisanie go na czystsze rozwiązanie zamiast nawarstwiać
  łatki na łatkach.

## Pozostałe wybrane zasady

- Do cięższych lub niezależnych części zadania używaj subagentów, żeby nie
  zaśmiecać głównego kontekstu rozmowy.
- Czynność wykonywaną częściej niż raz dziennie warto zamienić w skill lub
  slash command i zacommitować do repozytorium, zamiast powtarzać ją ręcznie
  za każdym razem.
