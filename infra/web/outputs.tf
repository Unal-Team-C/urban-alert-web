output "bucket_name" {
  description = "Bucket that holds the static export (target of scripts/publicar-sitio.sh)."
  value       = aws_s3_bucket.sitio.bucket
}

output "distribution_id" {
  description = "CloudFront distribution ID for cache invalidations; empty with the Lambda origin (plan D-012)."
  value       = var.cdn_habilitado ? aws_cloudfront_distribution.sitio[0].id : ""
}

output "site_url" {
  description = "Public HTTPS URL of the site (CloudFront, or the Lambda function URL while CloudFront is blocked)."
  value = (var.cdn_habilitado
    ? "https://${aws_cloudfront_distribution.sitio[0].domain_name}"
    : trimsuffix(aws_lambda_function_url.origen[0].function_url, "/")
  )
}
