provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "urban-alert"
      Service   = "web"
      ManagedBy = "terraform"
      Stack     = "web"
    }
  }
}

# AWS WAF for CloudFront only exists in us-east-1 (plan D-013).
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "urban-alert"
      Service   = "web"
      ManagedBy = "terraform"
      Stack     = "web"
    }
  }
}
