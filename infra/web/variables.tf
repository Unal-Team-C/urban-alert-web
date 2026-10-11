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
