
terraform {
  backend "s3" {
    bucket         = "gamelift-terraform"
    key            = "terraform.tfstate"
    region         = "us-east-1"

    dynamodb_table = "gamelift-terraform"
  }
}

provider "aws" {
  alias      = "site_creator"

  region     = "us-east-1"
  access_key = var.site_creator_access_key
  secret_key = var.site_creator_secret_key
}

module "site" {
  source = "git@github.com:therealsamf/terraform-docs-module.git"

  project_name = "gamelift"
  bucket       = "kontest-docs-gamelift"

  providers = {
    aws = aws.site_creator
  }
}
