variable "region" {
  description = "AWS region of the site bucket (CloudFront itself is global)."
  type        = string
  default     = "us-east-2"
}

variable "nombre" {
  description = "Name prefix for every resource of the web frontend."
  type        = string
  default     = "urban-alert-web"

  validation {
    condition     = startswith(var.nombre, "urban-alert-")
    error_message = "nombre must start with urban-alert- (bootstrap policies are scoped to that prefix)."
  }
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100: North America and Europe edges, the cheapest)."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200 or PriceClass_All."
  }
}

variable "cdn_habilitado" {
  description = "true: CloudFront serves the site (plan D-006). false: a Lambda function URL serves it, for when CloudFront is unavailable to the account (plan D-012)."
  type        = bool
  default     = true
}

variable "concurrencia_reservada" {
  description = "Reserved concurrency of the Lambda origin (-1: unreserved). An account whose quota is 10 rejects any reservation."
  type        = number
  default     = -1

  validation {
    condition     = var.concurrencia_reservada == -1 || var.concurrencia_reservada >= 1
    error_message = "concurrencia_reservada must be -1 (unreserved) or at least 1."
  }
}

variable "waf_habilitado" {
  description = "Attach the basic AWS WAF web ACL to the distribution (plan D-013; ~9 USD/month). Only with cdn_habilitado = true."
  type        = bool
  default     = false
}

variable "waf_solo_monitor" {
  description = "true: WAF rules only count matching requests (monitor mode); false: they block them."
  type        = bool
  default     = false
}

variable "waf_limite_peticiones" {
  description = "Maximum requests per client IP in any 5-minute window before WAF blocks it (a page load is ~20 requests)."
  type        = number
  default     = 1000

  validation {
    condition     = var.waf_limite_peticiones >= 10 && var.waf_limite_peticiones <= 2000000000
    error_message = "waf_limite_peticiones must be between 10 and 2,000,000,000 (AWS WAF rate-based rule limits)."
  }
}
