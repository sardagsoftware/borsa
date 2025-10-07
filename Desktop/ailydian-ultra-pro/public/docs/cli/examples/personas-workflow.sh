#!/bin/bash
# LyDian CLI - Personas (Insan-IQ) Workflow Example
# Demonstrates persona and skill management

set -e

echo "=== Personas (Insan-IQ) Workflow ==="
echo ""

# 1. Create a customer persona
echo "1. Creating customer persona..."
CUSTOMER_RESPONSE=$(lydian personas create \
  --name "John Smith" \
  --type customer \
  --email "john.smith@example.com" \
  --phone "+1-555-0123" \
  --attributes '{"age": 35, "location": "New York", "interests": ["technology", "AI"]}' \
  --skills "JavaScript,Python,Cloud Architecture" \
  --json)

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "Customer persona created with ID: $CUSTOMER_ID"
echo ""

# 2. Create an employee persona
echo "2. Creating employee persona..."
EMPLOYEE_RESPONSE=$(lydian personas create \
  --name "Sarah Johnson" \
  --type employee \
  --email "sarah.johnson@lydian.com" \
  --attributes '{"department": "Engineering", "level": "Senior", "team": "AI Research"}' \
  --skills "Machine Learning,Deep Learning,TensorFlow" \
  --json)

EMPLOYEE_ID=$(echo $EMPLOYEE_RESPONSE | jq -r '.id')
echo "Employee persona created with ID: $EMPLOYEE_ID"
echo ""

# 3. Create a citizen persona for smart city
echo "3. Creating citizen persona..."
CITIZEN_RESPONSE=$(lydian personas create \
  --name "Ahmet Yılmaz" \
  --type citizen \
  --email "ahmet.yilmaz@example.com" \
  --attributes '{"city": "Istanbul", "district": "Kadıköy", "age": 42}' \
  --json)

CITIZEN_ID=$(echo $CITIZEN_RESPONSE | jq -r '.id')
echo "Citizen persona created with ID: $CITIZEN_ID"
echo ""

# 4. List all personas
echo "4. Listing all personas..."
lydian personas list --limit 10
echo ""

# 5. Get customer persona details
echo "5. Getting customer persona details..."
lydian personas get $CUSTOMER_ID
echo ""

# 6. Manage persona skills
echo "6. Managing persona skills..."

# List skills
echo "  a) Listing current skills..."
lydian personas skills $CUSTOMER_ID --list
echo ""

# Add new skill
echo "  b) Adding new skill: React..."
lydian personas skills $CUSTOMER_ID --add "React"
echo ""

# Publish skill
echo "  c) Publishing skill (make it public)..."
# This would require skill ID from previous steps
echo "  (Skill publishing would use actual skill ID)"
echo ""

# 7. Filter personas by type
echo "7. Filtering personas by type..."
echo "  - Customers:"
lydian personas list --type customer --limit 5
echo ""

echo "  - Employees:"
lydian personas list --type employee --limit 5
echo ""

# 8. Export persona data
echo "8. Exporting persona data..."
lydian personas get $CUSTOMER_ID --json > customer_persona.json
lydian personas get $EMPLOYEE_ID --json > employee_persona.json
lydian personas get $CITIZEN_ID --json > citizen_persona.json
echo "Personas exported to JSON files"
echo ""

# 9. Bulk operations
echo "9. Bulk persona listing with different formats..."
echo "  - JSON format:"
lydian personas list --limit 3 --json | jq '.[].name'
echo ""

echo "  - YAML format:"
lydian personas list --limit 3 --yaml | head -20
echo ""

echo "=== Personas Workflow Complete ==="
echo ""
echo "Created personas:"
echo "  - Customer ID: $CUSTOMER_ID"
echo "  - Employee ID: $EMPLOYEE_ID"
echo "  - Citizen ID: $CITIZEN_ID"
echo ""
echo "Exported files:"
echo "  - customer_persona.json"
echo "  - employee_persona.json"
echo "  - citizen_persona.json"
echo ""
echo "Next steps:"
echo "  - Add more skills: lydian personas skills --help"
echo "  - Update attributes: lydian personas update --help"
echo "  - Link to cities: lydian cities --help"
