output "ecr_repository" { value = aws_ecr_repository.backend.repository_url }
output "ecs_cluster" { value = aws_ecs_cluster.main.name }
output "ecs_api_service" { value = aws_ecs_service.api.name }
output "ecs_worker_service" { value = aws_ecs_service.worker.name }
output "ecs_api_task_family" { value = aws_ecs_task_definition.api.family }
output "ecs_worker_task_family" { value = aws_ecs_task_definition.worker.family }
output "ecs_subnets" { value = join(",", aws_subnet.public[*].id) }
output "ecs_security_group" { value = aws_security_group.app.id }
output "frontend_bucket" { value = aws_s3_bucket.frontend.id }
output "reports_bucket" { value = aws_s3_bucket.reports.id }
output "cloudfront_distribution_id" { value = aws_cloudfront_distribution.frontend.id }
output "database_secret_arn" {
  value     = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive = true
}
output "aws_deploy_role_arn" { value = aws_iam_role.github_deploy.arn }
output "alerts_topic_arn" { value = aws_sns_topic.alerts.arn }
