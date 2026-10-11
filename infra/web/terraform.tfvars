# Values are documented in variables.tf; change them here, in a commit, never by hand in AWS.
nombre      = "urban-alert-web"
price_class = "PriceClass_100"
# false until AWS Support verifies the account for CloudFront (plan D-012); then true and a new Provision.
cdn_habilitado         = false
concurrencia_reservada = -1
