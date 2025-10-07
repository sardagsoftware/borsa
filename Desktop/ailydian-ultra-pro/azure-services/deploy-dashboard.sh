#!/bin/bash

# ========================================
# AZURE DASHBOARD DEPLOYMENT SCRIPT
# ========================================
# Deploy Ailydian Ultra Pro Unified Monitoring Dashboard
# to Azure Portal using ARM template
#
# Usage: ./deploy-dashboard.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Azure Dashboard Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
RESOURCE_GROUP="ailydian-ultra-pro-rg"
LOCATION="eastus"
DASHBOARD_NAME="Ailydian-Ultra-Pro-Unified-Dashboard"
TEMPLATE_FILE="azure-services/azure-dashboard-arm-template.json"
DEPLOYMENT_NAME="ailydian-dashboard-deployment-$(date +%Y%m%d-%H%M%S)"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Azure CLI found${NC}"

# Check if logged in to Azure
echo -e "${BLUE}Checking Azure login status...${NC}"
az account show &> /dev/null || {
    echo -e "${YELLOW}⚠ Not logged in to Azure${NC}"
    echo -e "${BLUE}Opening Azure login...${NC}"
    az login
}

# Get current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

echo -e "${GREEN}✓ Logged in to Azure${NC}"
echo -e "${BLUE}  Subscription: ${SUBSCRIPTION_NAME}${NC}"
echo -e "${BLUE}  ID: ${SUBSCRIPTION_ID}${NC}"
echo ""

# Check if resource group exists
echo -e "${BLUE}Checking if resource group exists...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Resource group '${RESOURCE_GROUP}' exists${NC}"
else
    echo -e "${YELLOW}⚠ Resource group '${RESOURCE_GROUP}' does not exist${NC}"
    echo -e "${BLUE}Creating resource group...${NC}"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags project=ailydian-ultra-pro environment=production
    echo -e "${GREEN}✓ Resource group created${NC}"
fi
echo ""

# Validate ARM template
echo -e "${BLUE}Validating ARM template...${NC}"
az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters \
        dashboardName="$DASHBOARD_NAME" \
        subscriptionId="$SUBSCRIPTION_ID" \
        resourceGroupName="$RESOURCE_GROUP" \
    > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ARM template is valid${NC}"
else
    echo -e "${RED}❌ ARM template validation failed${NC}"
    exit 1
fi
echo ""

# Deploy dashboard
echo -e "${BLUE}Deploying dashboard to Azure Portal...${NC}"
echo -e "${YELLOW}  Dashboard Name: ${DASHBOARD_NAME}${NC}"
echo -e "${YELLOW}  Resource Group: ${RESOURCE_GROUP}${NC}"
echo -e "${YELLOW}  Deployment: ${DEPLOYMENT_NAME}${NC}"
echo ""

az deployment group create \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters \
        dashboardName="$DASHBOARD_NAME" \
        subscriptionId="$SUBSCRIPTION_ID" \
        resourceGroupName="$RESOURCE_GROUP"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Dashboard deployed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Get dashboard URL
    DASHBOARD_ID=$(az deployment group show \
        --name "$DEPLOYMENT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query properties.outputs.dashboardId.value -o tsv)
    
    DASHBOARD_URL="https://portal.azure.com/#@/dashboard/arm${DASHBOARD_ID}"
    
    echo -e "${BLUE}Dashboard Details:${NC}"
    echo -e "${YELLOW}  Name: ${DASHBOARD_NAME}${NC}"
    echo -e "${YELLOW}  Resource ID: ${DASHBOARD_ID}${NC}"
    echo -e "${YELLOW}  URL: ${DASHBOARD_URL}${NC}"
    echo ""
    
    echo -e "${GREEN}To view the dashboard:${NC}"
    echo -e "1. Open Azure Portal: https://portal.azure.com"
    echo -e "2. Click 'Dashboard' in the left menu"
    echo -e "3. Select '${DASHBOARD_NAME}' from the dropdown"
    echo ""
    echo -e "${BLUE}Or open directly:${NC}"
    echo -e "${YELLOW}${DASHBOARD_URL}${NC}"
    echo ""
    
    # Ask if user wants to open dashboard
    read -p "$(echo -e ${BLUE}Open dashboard in browser? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Opening dashboard...${NC}"
        open "$DASHBOARD_URL" 2>/dev/null || xdg-open "$DASHBOARD_URL" 2>/dev/null || echo -e "${YELLOW}Please open the URL manually${NC}"
    fi
    
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ Dashboard deployment failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
