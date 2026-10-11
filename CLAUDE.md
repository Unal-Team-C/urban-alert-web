@AGENTS.md

# CLAUDE.md

Frontend web de UrbanAlert (Next.js 16 App Router, React 19, Tailwind 4, Leaflet), extraído del monorepo UrbanAlert para
migrarlo a AWS. Todo se ejecuta en el navegador: se publica como sitio estático (spec `specs/001-migracion-aws/`).

- Local: `npm run dev` (reenvía `/api/v1/*` a los servicios locales), `npm test`, `npm run lint`, `npm run build` (genera `out/`).

## Desarrollo guiado por especificaciones (SDD)

Este proyecto usa un arnés SDD con persistencia en disco para sobrevivir a interrupciones de sesión.
El protocolo es obligatorio en todas las sesiones:

@.sdd/PROTOCOL.md
