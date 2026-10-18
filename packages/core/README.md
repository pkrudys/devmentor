# @devmentor/core

Logika domenowa wielokrotnego użytku i kontener Dependency Injection
([Awilix](https://github.com/jeffijoe/awilix)) dla DevMentor.

- `src/types.ts` — `Cradle`, czyli kontrakt kontenera (co można `resolve()`).
- `src/container.ts` — `createAppContainer()`, fabryka kontenera z
  rejestracjami.

## Dodawanie nowej zależności do kontenera

1. Dodaj pole do `Cradle` w `src/types.ts`.
2. Zarejestruj implementację w `createAppContainer()` (`asClass`, `asFunction`
   lub `asValue` — patrz [dokumentacja Awilix](https://github.com/jeffijoe/awilix#api)).
3. Konsumuj przez `container.resolve("twojaZaleznosc")` w `@devmentor/app`.

Usługi dostępu do danych (repozytoria, encje) powinny być definiowane w
`@devmentor/db` i wstrzykiwane tutaj, a nie odwrotnie.
