# @devmentor/ui

Komponenty UI wielokrotnego użytku, oparte na [shadcn-ui](https://ui.shadcn.com/)
i Tailwind CSS. Używane głównie przez strony/panele backendowe DevMentor.

- `src/components/ui/` — komponenty w stylu shadcn-ui (skopiowane/rozszerzane,
  nie instalowane jako zależność — to jest cel shadcn-ui: kod komponentu żyje
  u ciebie).
- `src/lib/utils.ts` — `cn()`, standardowy helper `clsx` + `tailwind-merge`.
- `components.json` — konfiguracja shadcn-ui CLI. Nowe komponenty dodawaj z
  poziomu tego pakietu:

  ```bash
  cd packages/ui
  npx shadcn@latest add <komponent>
  ```

Tailwind sam w sobie nie jest tu budowany — klasy użyte w `src/` są skanowane
przez Tailwind skonfigurowany w `@devmentor/app` (`@source` w
`packages/app/src/app/globals.css`). Tokeny kolorów (`bg-primary`,
`bg-destructive`, ...) pochodzą z `@theme` w tym samym pliku — jeśli inna
aplikacja w przyszłości zacznie konsumować `@devmentor/ui`, musi zdefiniować
te same tokeny we własnym globalnym CSS.
