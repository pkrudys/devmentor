<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
