# Private bucket with the static export of Next.js (spec 001-migracion-aws RF-001, RF-007; plan D-005).
# Only the CloudFront distribution can read it (Origin Access Control); the provision workflow uploads the files.
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "sitio" {
  bucket = "${var.nombre}-${data.aws_caller_identity.current.account_id}"

  # The content is rebuilt from the commit on every Provision: Deprovision may delete it (constitution P4).
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "sitio" {
  bucket = aws_s3_bucket.sitio.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "sitio" {
  bucket = aws_s3_bucket.sitio.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sitio" {
  bucket = aws_s3_bucket.sitio.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Read access only for this distribution (AWS:SourceArn), over HTTPS.
data "aws_iam_policy_document" "sitio" {
  statement {
    sid       = "CloudFrontReadOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.sitio.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.sitio.arn]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.sitio.arn, "${aws_s3_bucket.sitio.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "sitio" {
  bucket = aws_s3_bucket.sitio.id
  policy = data.aws_iam_policy_document.sitio.json

  # The public access block must exist first, or a policy change could briefly be evaluated without it.
  depends_on = [aws_s3_bucket_public_access_block.sitio]
}
