variable "aws_region" {
  type    = string
  default = "sa-east-1"
}

variable "project_name" {
  type    = string
  default = "incluseon"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "domain_name" {
  description = "Public frontend domain, for example app.incluseon.com.br"
  type        = string
}

variable "api_domain_name" {
  description = "Public API domain, for example api.incluseon.com.br"
  type        = string
}

variable "hosted_zone_id" {
  type = string
}

variable "ses_from_email" {
  type = string
}

variable "alert_email" {
  description = "Address that receives operational and billing alerts"
  type        = string
}

variable "monthly_budget_usd" {
  type    = number
  default = 150
}

variable "app_secret_arn" {
  description = "Existing Secrets Manager JSON with SECRET_KEY and OPENAI_API_KEY"
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub owner/repository"
  type        = string
}

variable "github_oidc_provider_arn" {
  description = "Existing token.actions.githubusercontent.com OIDC provider ARN"
  type        = string
}

variable "api_cpu" {
  type    = number
  default = 512
}

variable "api_memory" {
  type    = number
  default = 1024
}

variable "worker_cpu" {
  type    = number
  default = 512
}

variable "worker_memory" {
  type    = number
  default = 1024
}

variable "initial_desired_count" {
  description = "Keep zero for first provisioning; CI/CD starts services after pushing the first image"
  type        = number
  default     = 0
}
