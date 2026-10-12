# Values are documented in variables.tf; change them here, in a commit, never by hand in AWS.
nombre      = "urban-alert-web"
price_class = "PriceClass_100"
# true: CloudFront (account verified 2026-10-12). false only if CloudFront becomes unavailable again (plan D-012).
cdn_habilitado         = true
concurrencia_reservada = -1
# Basic AWS WAF in front of CloudFront (plan D-013): off by user decision for the one-week prototype (2026-10-12).
waf_habilitado        = false
waf_solo_monitor      = false
waf_limite_peticiones = 1000
