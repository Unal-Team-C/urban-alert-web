# Recursos de arranque

Terraform no gestiona estos recursos: los necesita para poder ejecutarse, y el desaprovisionamiento de este repo no debe tocarlos (constitución P2). El frontend reutiliza los que ya existen y solo **añade una política** para CloudFront.

Cuenta `348364742283`, región `us-east-2`.

## 1. Lo que se reutiliza

| Recurso | ID en AWS | Dónde está documentado y versionado |
|---|---|---|
| Proveedor OIDC de GitHub | `arn:aws:iam::348364742283:oidc-provider/token.actions.githubusercontent.com` | [urban-alert-geoespacial/infra/bootstrap](https://github.com/Unal-Team-C/urban-alert-geoespacial/tree/main/infra/bootstrap) |
| Rol de los workflows (`github-actions-…`) | ARN en el secreto `AWS_ROLE_ARN` | Confianza: `github-oidc-trust.json` de Geoespacial. Admite `repo:Unal-Team-C@335834608/*:ref:refs/heads/main`, así que cubre este repo sin cambios |
| Política `github-actions-urban-alertPolicy` | `arn:aws:iam::348364742283:policy/github-actions-urban-alertPolicy` | `github-deploy-policy.json` de Geoespacial. Aquí se usa su bloque `S3ProjectBuckets` (`s3:*` sobre `urban-alert-*`): bucket del sitio y `aws s3 sync` |
| Política `github-actions-urban-alert-platform` | `arn:aws:iam::348364742283:policy/github-actions-urban-alert-platform` | [urban-alert-plataforma/infra/bootstrap](https://github.com/Unal-Team-C/urban-alert-plataforma/tree/main/infra/bootstrap). Aquí se usa `ssm:GetParameter*` sobre `/urban-alert/*` (URL del gateway) |
| Política `github-actions-urban-alert-multimedia` | `arn:aws:iam::348364742283:policy/github-actions-urban-alert-multimedia` | [Urban-Alert-multimedia/infra/bootstrap](https://github.com/Unal-Team-C/Urban-Alert-multimedia/tree/main/infra/bootstrap) (`github-multimedia-policy.json`). Origen alternativo Lambda (plan D-012): `lambda:*` sobre `urban-alert-*`, `iam:PassRole` a Lambda, grupos `/aws/lambda/urban-alert-*` |
| Política `github-actions-urban-alert-terraform` | `arn:aws:iam::348364742283:policy/github-actions-urban-alert-terraform` | `github-terraform-policy.json` de Geoespacial: crear el rol `urban-alert-web-origen` con políticas en línea |
| Bucket del estado | `urban-alert-tfstate-348364742283` | Geoespacial. Este repo usa la clave `web/terraform.tfstate` |

## 2. Lo que se añade: política `github-actions-urban-alert-web`

El rol no tiene permisos de CloudFront. (CloudFront exige además que la cuenta esté verificada por AWS Support: lo estuvo el 2026-10-12. El origen alternativo Lambda no necesita esta política.) Un administrador de la cuenta crea la política con [github-web-policy.json](github-web-policy.json) y la adjunta al rol de los workflows, **antes del primer Provision**:

```bash
aws iam create-policy --policy-name github-actions-urban-alert-web \
  --policy-document file://infra/bootstrap/github-web-policy.json
aws iam attach-role-policy --role-name <rol-de-github> \
  --policy-arn arn:aws:iam::348364742283:policy/github-actions-urban-alert-web
```

Para actualizarla tras un cambio del JSON (se conservan hasta 5 versiones; borra la más antigua si hace falta):

```bash
aws iam create-policy-version --set-as-default \
  --policy-arn arn:aws:iam::348364742283:policy/github-actions-urban-alert-web \
  --policy-document file://infra/bootstrap/github-web-policy.json
```

| Bloque | Para qué |
|---|---|
| `CloudFrontWebStack` | Distribución, Origin Access Control, CloudFront Function, etiquetas e invalidaciones de caché, limitadas a los recursos de CloudFront de la cuenta |
| `CloudFrontReadManagedPoliciesAndLists` | Leer las políticas gestionadas de caché (`Managed-CachingOptimized`) y de cabeceras (`Managed-SecurityHeadersPolicy`) por nombre, y las acciones `List*`, que no admiten restringir el recurso |

Si el primer aprovisionamiento falla con `AccessDenied`, el mensaje indica la acción: se añade al JSON en este repo y el administrador vuelve a aplicarlo con `create-policy-version`.

## 3. Lo que hay que configurar en este repo (una vez)

Settings → Secrets and variables → Actions de `Unal-Team-C/urban-alert-web`:

| Tipo | Nombre | Valor de ejemplo |
|---|---|---|
| Secreto | `AWS_ROLE_ARN` | `arn:aws:iam::348364742283:role/github-actions-<nombre>` (el mismo que usan los microservicios) |
| Variable | `AWS_REGION` | `us-east-2` |

```bash
gh secret set AWS_ROLE_ARN --repo Unal-Team-C/urban-alert-web      # pega el ARN cuando lo pida
gh variable set AWS_REGION --repo Unal-Team-C/urban-alert-web --body us-east-2
```

## 4. Requisitos previos en la cuenta

- La plataforma compartida aprovisionada (workflow Provision de `urban-alert-plataforma`). Si no, Provision falla al principio con «La plataforma compartida no está aprovisionada».
- No debe existir el bucket `urban-alert-web-348364742283` creado a mano: lo crea Terraform.
