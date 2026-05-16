#!/bin/bash

# OmniVision Backend Integration Test Script
# Tests all REST API endpoints

BASE_URL="http://localhost:8000"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         OmniVision Backend Integration Test                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description ... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($response)"
    else
        echo -e "${RED}✗ FAIL${NC} ($response)"
    fi
}

echo "═══ Core Endpoints ═══"
test_endpoint "GET" "/api/health" "" "Health check"
test_endpoint "GET" "/api/sectors" "" "List sectors"
test_endpoint "GET" "/api/cameras" "" "List cameras"
test_endpoint "GET" "/api/alerts" "" "List alerts"
test_endpoint "GET" "/api/alerts/stats" "" "Alert statistics"

echo ""
echo "═══ POS Endpoints ═══"
test_endpoint "GET" "/api/pos/daily-summary" "" "Daily sales summary"
test_endpoint "GET" "/api/pos/sales-history" "" "Sales history"
test_endpoint "GET" "/api/pos/products" "" "Product catalog"

echo ""
echo "═══ Training Images ═══"
test_endpoint "GET" "/api/training-images" "" "List training images"
test_endpoint "GET" "/api/training-images/stats" "" "Training stats"

echo ""
echo "═══ Data Operations ═══"
test_endpoint "GET" "/api/export" "" "Export all data"

echo ""
echo "═══ Camera Operations ═══"
echo "Adding test camera for each sector..."

for sector in retail hospitality liquor clubs security education agriculture; do
    test_endpoint "POST" "/api/cameras" "{\"id\":\"test_${sector}_auto\",\"name\":\"${sector^} Auto Test\",\"type\":\"webcam\",\"module\":\"$sector\",\"status\":\"offline\"}" "Add camera: $sector"
done

echo ""
echo "═══ Camera Count by Sector ═══"
curl -s "$BASE_URL/api/cameras" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    sectors = {}
    for c in data:
        sectors.setdefault(c['module'], []).append(c['name'])
    for k, v in sorted(sectors.items()):
        print(f'  {k}: {len(v)} cameras')
except:
    print('  Error parsing camera data')
"

echo ""
echo "═══ Alert Operations ═══"
test_endpoint "POST" "/api/alerts" "{\"type\":\"theft\",\"severity\":\"alert\",\"camera_id\":\"test_retail_auto\",\"message\":\"Test alert\"}" "Create alert"

echo ""
echo "═══ Sector Config Operations ═══"
test_endpoint "POST" "/api/sectors/retail" "{\"enabled\":true,\"aiModel\":\"yolov8\",\"confidenceThreshold\":0.7}" "Update retail config"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                     Test Complete                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:5173 in browser"
echo "  2. Test adding cameras via UI for each sector"
echo "  3. Upload training images for a sector"
echo "  4. Check that all data persists in backend/omnivision.db"
