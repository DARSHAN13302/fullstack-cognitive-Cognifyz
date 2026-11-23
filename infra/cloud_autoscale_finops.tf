terraform {
  required_version = ">= 1.7.0"
}
variable "environment" { default = "staging" }
locals {
  common_tags = {
    project     = "fullstack-cognitive-v7"
    environment = var.environment
    finops_cost_center = "internship-free-tier"
  }
}
