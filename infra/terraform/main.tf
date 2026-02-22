# ============================================================================
# AILYDIAN ULTRA PRO - TERRAFORM INFRASTRUCTURE
# ============================================================================
# Purpose: Alternative IaC using Terraform (for teams preferring Terraform)
# Provider: Azure (azurerm)
# Capacity: 30K concurrent users, 200-500 RPS
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state storage (Azure Blob)
  backend "azurerm" {
    resource_group_name  = "ailydian-tfstate-rg"
    storage_account_name = "ailydiantfstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "primary_region" {
  description = "Primary Azure region"
  type        = string
  default     = "westeurope"
}

variable "secondary_region" {
  description = "Secondary Azure region for DR"
  type        = string
  default     = "northeurope"
}

variable "name_prefix" {
  description = "Resource name prefix"
  type        = string
  default     = "ailydian"
}

variable "postgresql_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for management access"
  type        = list(string)
  default     = []
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  common_tags = {
    Project     = "Ailydian Ultra Pro"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
    Owner       = "Lydian"
  }

  resource_group_name = "${var.name_prefix}-${var.environment}-rg"
}

# ============================================================================
# RESOURCE GROUP
# ============================================================================

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.primary_region
  tags     = local.common_tags
}

# ============================================================================
# LOG ANALYTICS WORKSPACE
# ============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.name_prefix}-${var.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = local.common_tags
}

# ============================================================================
# APPLICATION INSIGHTS
# ============================================================================

resource "azurerm_application_insights" "main" {
  name                = "${var.name_prefix}-${var.environment}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"
  workspace_id        = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# ============================================================================
# VIRTUAL NETWORK
# ============================================================================

resource "azurerm_virtual_network" "main" {
  name                = "${var.name_prefix}-${var.environment}-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]

  tags = local.common_tags
}

# Subnets
resource "azurerm_subnet" "container_apps" {
  name                 = "container-apps-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]

  delegation {
    name = "container-apps-delegation"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "postgresql-delegation"

    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_subnet" "redis" {
  name                 = "redis-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.3.0/24"]
}

resource "azurerm_subnet" "apim" {
  name                 = "apim-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.4.0/24"]
}

# ============================================================================
# POSTGRESQL FLEXIBLE SERVER
# ============================================================================

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.name_prefix}-${var.environment}-psql"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  delegated_subnet_id    = azurerm_subnet.database.id
  administrator_login    = "ailydianadmin"
  administrator_password = var.postgresql_admin_password

  storage_mb = 262144 # 256GB

  sku_name = "GP_Standard_D4ds_v4" # 4 vCores, 16GB RAM

  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  maintenance_window {
    day_of_week  = 0 # Sunday
    start_hour   = 3
    start_minute = 0
  }

  tags = local.common_tags
}

resource "azurerm_postgresql_flexible_server_database" "ailydian" {
  name      = "ailydian"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "200"
}

# ============================================================================
# REDIS CACHE
# ============================================================================

resource "azurerm_redis_cache" "main" {
  name                = "${var.name_prefix}-${var.environment}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  subnet_id           = azurerm_subnet.redis.id

  redis_configuration {
    enable_authentication           = true
    maxmemory_reserved              = 125
    maxmemory_delta                 = 125
    maxmemory_policy                = "allkeys-lru"
    rdb_backup_enabled              = true
    rdb_backup_frequency            = 60
    rdb_storage_connection_string   = azurerm_storage_account.main.primary_blob_connection_string
  }

  tags = local.common_tags
}

# ============================================================================
# STORAGE ACCOUNT
# ============================================================================

resource "azurerm_storage_account" "main" {
  name                     = "${var.name_prefix}${var.environment}stor"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "ZRS" # Zone-redundant
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  tags = local.common_tags
}

resource "azurerm_storage_container" "containers" {
  for_each = toset(["uploads", "backups", "logs", "static-assets"])

  name                  = each.value
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# ============================================================================
# CONTAINER REGISTRY
# ============================================================================

resource "azurerm_container_registry" "main" {
  name                = "${var.name_prefix}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Premium"
  admin_enabled       = false

  georeplications {
    location = var.secondary_region
    tags     = local.common_tags
  }

  tags = local.common_tags
}

# ============================================================================
# CONTAINER APPS ENVIRONMENT
# ============================================================================

resource "azurerm_container_app_environment" "main" {
  name                       = "${var.name_prefix}-${var.environment}-cae"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  infrastructure_subnet_id   = azurerm_subnet.container_apps.id

  tags = local.common_tags
}

# ============================================================================
# KEY VAULT
# ============================================================================

resource "azurerm_key_vault" "main" {
  name                        = "${var.name_prefix}-${var.environment}-kv"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  sku_name                    = "premium"

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
    ip_rules       = var.allowed_ip_ranges
  }

  tags = local.common_tags
}

data "azurerm_client_config" "current" {}

# ============================================================================
# OUTPUTS
# ============================================================================

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_primary_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "acr_login_server" {
  description = "Container registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "container_apps_environment_id" {
  description = "Container Apps environment ID"
  value       = azurerm_container_app_environment.main.id
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}
