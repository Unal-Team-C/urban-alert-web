# Constitución del proyecto

- **Versión**: 1.0.0
- **Última modificación**: 2026-10-11

> Principios no negociables. Todo `plan.md` se verifica contra ellos (§3 del plan).
> Una excepción exige justificación escrita en el plan. Cada principio debe ser concreto y verificable.

## Principios

### P1. Infraestructura solo como código, aplicada solo desde GitHub Actions
Todo recurso de AWS del frontend está definido en Terraform en este repositorio y solo lo crean, cambian o eliminan los workflows de `.github/workflows/` ejecutados en `main`. La publicación del sitio (subida de archivos e invalidación de caché) también la hace solo el workflow. En local solo se ejecuta `init -backend=false`, `fmt`, `validate` y `test`; nunca `plan`/`apply`/`destroy` contra el estado real ni cambios en la consola (salvo los recursos de arranque, P2).
**Por qué**: un único camino de cambio hace el entorno repetible, revisable y reconstruible.

### P2. Recursos de arranque y recursos ajenos fuera de este estado
El proveedor OIDC, el rol de los workflows y sus políticas, y el bucket `urban-alert-tfstate-348364742283` son de arranque (documentados en `urban-alert-geoespacial/infra/bootstrap/`; la política propia del frontend, versionada en `infra/bootstrap/` de este repo). La plataforma compartida (`urban-alert-plataforma`) y los recursos de los microservicios (rutas del gateway, CORS) nunca aparecen en el estado de este repo: se leen (SSM, `data`) pero no se gestionan.
**Por qué**: si este repo los gestionara, su desaprovisionamiento rompería a los workflows o a otro servicio.

### P3. Sin secretos ni credenciales de larga duración
Los workflows se autentican solo con OIDC (`role-to-assume`). Ningún secreto aparece en el repositorio, en el sitio publicado, en variables de GitHub, en salidas de Terraform ni en logs. Todo lo que se incrusta en el build (`NEXT_PUBLIC_*`) es público por definición y nunca es un secreto.
**Por qué**: el repositorio, los logs de Actions y el JavaScript publicado los ve cualquiera.

### P4. Cambios destructivos solo explícitos
Solo el workflow manual de desaprovisionamiento, con confirmación escrita, elimina el entorno. El sitio no guarda datos propios: su contenido se reconstruye desde el commit.
**Por qué**: un `destroy` accidental deja a los usuarios sin aplicación.

### P5. Coste mínimo y documentado
Se elige la opción más barata que cumpla la spec (proyecto académico, un entorno). Todo recurso con coste figura en la tabla de costes del README con su estimación mensual; añadir uno nuevo exige justificarlo en `plan.md §Decisiones`.
**Por qué**: la cuenta la paga el equipo.

### P6. Validación antes de cada commit y antes de cada apply
Antes de cada commit de tarea y como primer job de Provision pasan: `npm run lint`, `npm test`, `npm run build`, `terraform fmt -check -recursive`, `validate` y `test` de cada stack (`-lockfile=readonly`), `actionlint` y `shellcheck`. En local, Terraform y los linters se ejecutan con Podman.
**Por qué**: los errores se detectan sin tocar AWS.

### P7. Pruebas de Terraform para lo que protege
Cada garantía de seguridad (bucket no público, acceso solo desde la distribución, solo HTTPS) tiene al menos un `run` en un `.tftest.hcl` con `mock_provider`.
**Por qué**: `validate` no comprueba intención.

### P8. Versiones fijadas y reproducibles
Terraform `>= 1.10, < 2.0` (CI y local con `hashicorp/terraform:1.16.5`), proveedor `hashicorp/aws ~> 6.0`, `.terraform.lock.hcl` versionado (hashes `linux_amd64`, `linux_arm64`, `darwin_arm64`); Node 24 y `package-lock.json` con `npm ci`; imágenes de herramientas y actions con versión fijada.
**Por qué**: el mismo commit produce el mismo resultado en local y en CI.

### P9. Contrato con la plataforma y nombres estables
El frontend consume la plataforma solo por su contrato SSM `/urban-alert/plataforma/*`; nunca copia la URL del gateway a mano. Llama a los microservicios solo por las rutas públicas `/api/v1/<servicio>/` del gateway. Todo recurso usa el prefijo `urban-alert-web` y las etiquetas `Project=urban-alert`, `Service=web`, `ManagedBy=terraform`, `Stack=<stack>`.
**Por qué**: la plataforma y el gateway son compartidos; salirse del contrato rompe a otros.

### P10. Ejecuciones serializadas e idempotentes
Provision y Deprovision comparten un grupo de `concurrency` sin cancelación; dos Provision seguidos sobre el mismo commit dan 0 cambios de infraestructura en el segundo.
**Por qué**: dos `apply` simultáneos o un plan que no converge corrompen el estado.

## Stack y restricciones técnicas

- Next.js 16 (App Router) + React 19, TypeScript, Tailwind 4, Leaflet; pruebas con Vitest + Testing Library.
- Toda la lógica corre en el navegador: sin rutas de servidor, proxy, server actions ni datos en el render del servidor.
- AWS, cuenta `348364742283`, región `us-east-2`, un entorno.
- Estado remoto en `s3://urban-alert-tfstate-348364742283/web/`, `encrypt = true`, `use_lockfile = true`.
- El rol OIDC solo confía en `refs/heads/main` de los repos de `Unal-Team-C`.

## Calidad y pruebas

- Aplicación: `npm run lint`, `npm test`, `npm run build`.
- Terraform: `podman run --rm -v "$PWD":/w -w /w docker.io/hashicorp/terraform:1.16.5 -chdir=infra/<stack> init -backend=false`, luego `validate` y `test`; `... fmt -check -recursive infra`
- Workflows: `podman run --rm -v "$PWD":/repo -w /repo docker.io/rhysd/actionlint:1.7.7`
- Scripts: `podman run --rm -v "$PWD":/mnt -w /mnt docker.io/koalaman/shellcheck:v0.10.0 scripts/*.sh scripts/tests/*.sh`

## Flujo de trabajo

- Desarrollo guiado por especificaciones según `.sdd/PROTOCOL.md`.
- Un commit local por tarea completada y verificada (P6); nunca `push` sin que el usuario lo pida.

## Historial

- 1.0.0 — 2026-10-11 — P1–P10 adaptados de `urban-alert-usuarios` para el frontend estático
