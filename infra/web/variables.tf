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
  description = "true: CloudFront serves the site (plan D-006). false: a Lambda function URL serves it while CloudFront is blocked for the account (plan D-012)."
  type        = bool
  default     = false
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
