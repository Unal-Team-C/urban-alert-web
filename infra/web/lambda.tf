# Temporary origin while CloudFront is blocked for the account (spec 001-migracion-aws §11, plan D-012):
# a Lambda function URL (HTTPS only) that reads the private bucket with its own role. Removed when
# cdn_habilitado = true. Permissions come from the existing bootstrap policies (multimedia: lambda:* on
# urban-alert-*, iam:PassRole to Lambda, /aws/lambda/urban-alert-* log groups; terraform: urban-alert-* roles).
locals {
  origen_lambda = var.cdn_habilitado ? 0 : 1
  nombre_origen = "${var.nombre}-origen"
}

data "archive_file" "origen" {
  count = local.origen_lambda

  type        = "zip"
  source_file = "${path.module}/origen/index.mjs"
  output_path = "${path.module}/.build/origen.zip"
}

data "aws_iam_policy_document" "origen_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "origen" {
  count = local.origen_lambda

  name               = local.nombre_origen
  description        = "UrbanAlert web: Lambda origin that serves the site from the private bucket"
  assume_role_policy = data.aws_iam_policy_document.origen_assume.json
}

resource "aws_cloudwatch_log_group" "origen" {
  count = local.origen_lambda

  name              = "/aws/lambda/${local.nombre_origen}"
  retention_in_days = 30
}

# Inline policies only: the bootstrap policy may attach no managed policy other than the ECS ones.
data "aws_iam_policy_document" "origen" {
  count = local.origen_lambda

  statement {
    sid       = "ReadSiteObjects"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.sitio.arn}/*"]
  }

  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.origen[0].arn}:*"]
  }
}

resource "aws_iam_role_policy" "origen" {
  count = local.origen_lambda

  name   = "${local.nombre_origen}-sitio"
  role   = aws_iam_role.origen[0].id
  policy = data.aws_iam_policy_document.origen[0].json
}

resource "aws_lambda_function" "origen" {
  count = local.origen_lambda

  function_name    = local.nombre_origen
  description      = "Serves the UrbanAlert static site from S3 (temporary, plan D-012)"
  role             = aws_iam_role.origen[0].arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.origen[0].output_path
  source_code_hash = data.archive_file.origen[0].output_base64sha256
  memory_size      = 256
  timeout          = 10

  reserved_concurrent_executions = var.concurrencia_reservada

  environment {
    variables = {
      BUCKET = aws_s3_bucket.sitio.bucket
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.origen[0].name
  }

  depends_on = [aws_iam_role_policy.origen]
}

# Public HTTPS endpoint: read-only GET/HEAD of the published files (the function answers 405 to anything else).
resource "aws_lambda_function_url" "origen" {
  count = local.origen_lambda

  function_name      = aws_lambda_function.origen[0].function_name
  authorization_type = "NONE"
  invoke_mode        = "BUFFERED"
}

# A public function URL needs both permissions (lambda:InvokeFunctionUrl and, via the URL only, lambda:InvokeFunction).
resource "aws_lambda_permission" "origen_url" {
  count = local.origen_lambda

  statement_id           = "FunctionURLAllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.origen[0].function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "origen_invoke" {
  count = local.origen_lambda

  statement_id             = "FunctionURLInvokeAllowPublicAccess"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.origen[0].function_name
  principal                = "*"
  invoked_via_function_url = true
}
