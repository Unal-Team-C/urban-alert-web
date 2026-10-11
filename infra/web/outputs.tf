output "bucket_name" {
  description = "Bucket that holds the static export (target of scripts/publicar-sitio.sh)."
  value       = aws_s3_bucket.sitio.bucket
}

output "distribution_id" {
  description = "CloudFront distribution ID (cache invalidations)."
  value       = aws_cloudfront_distribution.sitio.id
}

output "site_url" {
  description = "Public HTTPS URL of the site."
  value       = "https://${aws_cloudfront_distribution.sitio.domain_name}"
}
