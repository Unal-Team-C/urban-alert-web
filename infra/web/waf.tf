# Basic AWS WAF in front of CloudFront (spec 001-migracion-aws, plan D-013): per-IP rate limit plus three AWS managed
# rule groups that cost no subscription. CLOUDFRONT-scoped web ACLs live in us-east-1.
locals {
  waf = var.cdn_habilitado && var.waf_habilitado ? 1 : 0

  # Priority order: the cheap rate limit first, then reputation, then payload inspection.
  waf_grupos_gestionados = {
    "AWSManagedRulesAmazonIpReputationList" = 1
    "AWSManagedRulesCommonRuleSet"          = 2
    "AWSManagedRulesKnownBadInputsRuleSet"  = 3
  }
}

resource "aws_wafv2_web_acl" "sitio" {
  count    = local.waf
  provider = aws.us_east_1

  name        = var.nombre
  description = "UrbanAlert web: basic protections for the CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "limite-por-ip"
    priority = 0

    action {
      dynamic "block" {
        for_each = var.waf_solo_monitor ? [] : [1]
        content {}
      }
      dynamic "count" {
        for_each = var.waf_solo_monitor ? [1] : []
        content {}
      }
    }

    statement {
      rate_based_statement {
        limit                 = var.waf_limite_peticiones
        aggregate_key_type    = "IP"
        evaluation_window_sec = 300
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.nombre}-limite-por-ip"
      sampled_requests_enabled   = true
    }
  }

  dynamic "rule" {
    for_each = local.waf_grupos_gestionados

    content {
      name     = rule.key
      priority = rule.value

      # none: the group's own actions (block) apply; count: monitor mode.
      override_action {
        dynamic "none" {
          for_each = var.waf_solo_monitor ? [] : [1]
          content {}
        }
        dynamic "count" {
          for_each = var.waf_solo_monitor ? [1] : []
          content {}
        }
      }

      statement {
        managed_rule_group_statement {
          vendor_name = "AWS"
          name        = rule.key
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.nombre}-${rule.key}"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = var.nombre
    sampled_requests_enabled   = true
  }
}
