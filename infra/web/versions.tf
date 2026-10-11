terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    # Zip of the Lambda origin (plan D-012).
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}
