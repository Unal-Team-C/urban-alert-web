# CloudFront in front of the private bucket (spec RF-005, RF-006, RNF-001, RNF-002; plan D-006).
# Only with cdn_habilitado = true: the account must be verified by AWS Support first (plan D-012).
moved {
  from = aws_cloudfront_origin_access_control.sitio
  to   = aws_cloudfront_origin_access_control.sitio[0]
}

moved {
  from = aws_cloudfront_function.indice
  to   = aws_cloudfront_function.indice[0]
}

resource "aws_cloudfront_origin_access_control" "sitio" {
  count = var.cdn_habilitado ? 1 : 0

  name                              = var.nombre
  description                       = "UrbanAlert web: CloudFront reads the private site bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# /mapa/ -> /mapa/index.html: S3 behind OAC does not resolve folder indexes (funciones/indice.js has its tests).
resource "aws_cloudfront_function" "indice" {
  count = var.cdn_habilitado ? 1 : 0

  name    = "${var.nombre}-indice"
  runtime = "cloudfront-js-2.0"
  comment = "Folder index for the Next.js static export"
  publish = true
  code    = file("${path.module}/funciones/indice.js")
}

# Managed policies: caching that honours the Cache-Control of each object (set by scripts/publicar-sitio.sh)
# and the standard security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
data "aws_cloudfront_cache_policy" "caching_optimized" {
  count = var.cdn_habilitado ? 1 : 0

  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_response_headers_policy" "security_headers" {
  count = var.cdn_habilitado ? 1 : 0

  name = "Managed-SecurityHeadersPolicy"
}

locals {
  origen_s3 = "s3-sitio"
}

resource "aws_cloudfront_distribution" "sitio" {
  count = var.cdn_habilitado ? 1 : 0

  enabled             = true
  comment             = "UrbanAlert web frontend"
  default_root_object = "index.html"
  price_class         = var.price_class
  http_version        = "http2and3"
  is_ipv6_enabled     = true

  # Basic AWS WAF (waf.tf, plan D-013); null when disabled.
  web_acl_id = one(aws_wafv2_web_acl.sitio[*].arn)

  origin {
    origin_id                = local.origen_s3
    domain_name              = aws_s3_bucket.sitio.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.sitio[0].id
  }

  default_cache_behavior {
    target_origin_id           = local.origen_s3
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized[0].id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers[0].id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.indice[0].arn
    }
  }

  # Without s3:ListBucket, S3 answers 403 for a missing object: both become the Next.js 404 page with status 404.
  dynamic "custom_error_response" {
    for_each = [403, 404]

    content {
      error_code            = custom_error_response.value
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 60
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Default *.cloudfront.net certificate: no custom domain (spec §8).
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
