# terraform test with a mocked provider: no AWS credentials, no real resources (constitution P7).
mock_provider "aws" {
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "348364742283"
    }
  }

  # The real document is rendered by AWS-side logic; its inputs are what the tests check.
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }

  mock_data "aws_cloudfront_cache_policy" {
    defaults = {
      id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    }
  }

  mock_data "aws_cloudfront_response_headers_policy" {
    defaults = {
      id = "67f7725c-6f97-4210-82d7-5512b31e9d03"
    }
  }

  mock_resource "aws_s3_bucket" {
    defaults = {
      arn                         = "arn:aws:s3:::urban-alert-web-348364742283"
      bucket_regional_domain_name = "urban-alert-web-348364742283.s3.us-east-2.amazonaws.com"
    }
  }

  mock_resource "aws_cloudfront_distribution" {
    defaults = {
      arn         = "arn:aws:cloudfront::348364742283:distribution/E2EXAMPLE"
      domain_name = "d111111abcdef8.cloudfront.net"
    }
  }

  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::348364742283:role/urban-alert-web-origen"
    }
  }

  mock_resource "aws_cloudwatch_log_group" {
    defaults = {
      arn = "arn:aws:logs:us-east-2:348364742283:log-group:/aws/lambda/urban-alert-web-origen"
    }
  }

  mock_resource "aws_lambda_function" {
    defaults = {
      arn = "arn:aws:lambda:us-east-2:348364742283:function:urban-alert-web-origen"
    }
  }

  mock_resource "aws_lambda_function_url" {
    defaults = {
      function_url = "https://abc123xyz.lambda-url.us-east-2.on.aws/"
    }
  }

  mock_resource "aws_cloudfront_function" {
    defaults = {
      arn = "arn:aws:cloudfront::348364742283:function/urban-alert-web-indice"
    }
  }
}

run "the_bucket_is_private" {
  command = apply

  assert {
    condition     = aws_s3_bucket.sitio.bucket == "urban-alert-web-348364742283"
    error_message = "The bucket name must be urban-alert-web-<account> (prefix covered by the bootstrap S3 policy)."
  }

  assert {
    condition = alltrue([
      aws_s3_bucket_public_access_block.sitio.block_public_acls,
      aws_s3_bucket_public_access_block.sitio.block_public_policy,
      aws_s3_bucket_public_access_block.sitio.ignore_public_acls,
      aws_s3_bucket_public_access_block.sitio.restrict_public_buckets,
    ])
    error_message = "Every public access block setting must be on (spec RF-007)."
  }

  assert {
    condition     = aws_s3_bucket_ownership_controls.sitio.rule[0].object_ownership == "BucketOwnerEnforced"
    error_message = "ACLs must be disabled (BucketOwnerEnforced)."
  }
}

run "only_this_distribution_can_read_the_bucket" {
  command = apply

  variables {
    cdn_habilitado = true
  }

  assert {
    condition = length([
      for s in data.aws_iam_policy_document.sitio.statement : s
      if s.effect == "Allow"
    ]) == 1
    error_message = "The bucket policy must have exactly one Allow statement (CloudFront)."
  }

  assert {
    condition = alltrue([
      for s in data.aws_iam_policy_document.sitio.statement : (
        toset(s.actions) == toset(["s3:GetObject"]) &&
        one(s.principals).type == "Service" &&
        toset(one(s.principals).identifiers) == toset(["cloudfront.amazonaws.com"]) &&
        one(s.condition).variable == "AWS:SourceArn" &&
        toset(one(s.condition).values) == toset([aws_cloudfront_distribution.sitio[0].arn])
      ) if s.effect == "Allow"
    ])
    error_message = "Only cloudfront.amazonaws.com may read objects, and only for this distribution (AWS:SourceArn)."
  }

  assert {
    condition = anytrue([
      for s in data.aws_iam_policy_document.sitio.statement :
      s.effect == "Deny" && one(s.condition).variable == "aws:SecureTransport"
    ])
    error_message = "Requests without TLS must be denied."
  }
}

run "the_site_is_served_only_over_https_through_oac" {
  command = apply

  variables {
    cdn_habilitado = true
  }

  assert {
    condition     = aws_cloudfront_distribution.sitio[0].default_cache_behavior[0].viewer_protocol_policy == "redirect-to-https"
    error_message = "HTTP must redirect to HTTPS (spec RF-006)."
  }

  assert {
    condition     = one(aws_cloudfront_distribution.sitio[0].origin).origin_access_control_id == aws_cloudfront_origin_access_control.sitio[0].id
    error_message = "The S3 origin must use the Origin Access Control."
  }

  assert {
    condition = (
      aws_cloudfront_origin_access_control.sitio[0].signing_behavior == "always" &&
      aws_cloudfront_origin_access_control.sitio[0].signing_protocol == "sigv4" &&
      aws_cloudfront_origin_access_control.sitio[0].origin_access_control_origin_type == "s3"
    )
    error_message = "The OAC must always sign S3 requests with SigV4."
  }

  assert {
    condition     = aws_cloudfront_distribution.sitio[0].viewer_certificate[0].cloudfront_default_certificate
    error_message = "The default *.cloudfront.net certificate is used (no custom domain, spec §8)."
  }

  assert {
    condition     = aws_cloudfront_distribution.sitio[0].default_cache_behavior[0].response_headers_policy_id == data.aws_cloudfront_response_headers_policy.security_headers[0].id
    error_message = "Responses must carry the managed security headers (spec RNF-002)."
  }
}

run "routes_resolve_to_pages_and_missing_ones_are_404" {
  command = apply

  variables {
    cdn_habilitado = true
  }

  assert {
    condition = (
      one(aws_cloudfront_distribution.sitio[0].default_cache_behavior[0].function_association).event_type == "viewer-request" &&
      one(aws_cloudfront_distribution.sitio[0].default_cache_behavior[0].function_association).function_arn == aws_cloudfront_function.indice[0].arn
    )
    error_message = "The folder index function must run on viewer-request (spec RF-005)."
  }

  assert {
    condition     = aws_cloudfront_function.indice[0].runtime == "cloudfront-js-2.0" && aws_cloudfront_function.indice[0].publish
    error_message = "The index function must be published on the cloudfront-js-2.0 runtime."
  }

  assert {
    condition = toset([
      for e in aws_cloudfront_distribution.sitio[0].custom_error_response : e.error_code
      if e.response_code == 404 && e.response_page_path == "/404.html"
    ]) == toset([403, 404])
    error_message = "S3 403 and 404 must become /404.html with status 404 (spec RF-005)."
  }

  assert {
    condition     = output.site_url == "https://d111111abcdef8.cloudfront.net"
    error_message = "site_url must be the HTTPS URL of the distribution."
  }
}

run "resource_names_keep_the_project_prefix" {
  command = plan

  variables {
    nombre = "otro-web"
  }

  expect_failures = [var.nombre]
}

# Lambda origin while CloudFront is blocked (plan D-012): the default in terraform.tfvars.
run "lambda_origin_replaces_cloudfront" {
  command = apply

  assert {
    condition     = length(aws_cloudfront_distribution.sitio) == 0 && length(aws_cloudfront_origin_access_control.sitio) == 0 && length(aws_cloudfront_function.indice) == 0
    error_message = "No CloudFront resource may be created while cdn_habilitado = false (the account cannot create them)."
  }

  assert {
    condition     = length([for s in data.aws_iam_policy_document.sitio.statement : s if s.effect == "Allow"]) == 0
    error_message = "With the Lambda origin the bucket policy allows nobody: the function reads with its own role."
  }

  assert {
    condition     = output.site_url == "https://abc123xyz.lambda-url.us-east-2.on.aws" && output.distribution_id == ""
    error_message = "site_url must be the function URL without the trailing slash, and there is no distribution to invalidate."
  }
}

run "lambda_origin_is_https_read_only_and_least_privilege" {
  command = apply

  assert {
    condition     = aws_lambda_function_url.origen[0].authorization_type == "NONE" && aws_lambda_function_url.origen[0].invoke_mode == "BUFFERED"
    error_message = "The function URL is the public HTTPS endpoint of the site (function URLs only serve HTTPS, spec RF-006)."
  }

  assert {
    condition = (
      aws_lambda_permission.origen_url[0].action == "lambda:InvokeFunctionUrl" &&
      aws_lambda_permission.origen_url[0].function_url_auth_type == "NONE" &&
      aws_lambda_permission.origen_invoke[0].action == "lambda:InvokeFunction" &&
      aws_lambda_permission.origen_invoke[0].invoked_via_function_url
    )
    error_message = "Public invocation is allowed only through the function URL (both permissions are required)."
  }

  assert {
    condition = toset(flatten([for s in data.aws_iam_policy_document.origen[0].statement : s.actions])) == toset([
      "s3:GetObject", "logs:CreateLogStream", "logs:PutLogEvents",
    ])
    error_message = "The origin role may only read site objects and write its own logs."
  }

  assert {
    condition = alltrue([
      for s in data.aws_iam_policy_document.origen[0].statement :
      alltrue([for r in s.resources : startswith(r, "arn:aws:s3:::urban-alert-web-348364742283/") || startswith(r, aws_cloudwatch_log_group.origen[0].arn)])
    ])
    error_message = "The origin role is scoped to the site bucket and its own log group."
  }

  assert {
    condition     = aws_lambda_function.origen[0].environment[0].variables.BUCKET == aws_s3_bucket.sitio.bucket && aws_lambda_function.origen[0].runtime == "nodejs22.x"
    error_message = "The function reads the site bucket on the nodejs22.x runtime (it bundles the AWS SDK)."
  }

  assert {
    condition     = aws_cloudwatch_log_group.origen[0].retention_in_days == 30
    error_message = "Origin logs are kept 30 days."
  }
}

run "reserved_concurrency_is_unreserved_or_positive" {
  command = plan

  variables {
    concurrencia_reservada = 0
  }

  expect_failures = [var.concurrencia_reservada]
}
