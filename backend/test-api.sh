#!/bin/bash
# Script de pruebas automatizadas para AutoQuote API
# Ejecutar: bash backend/test-api.sh

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Iniciando pruebas de API - AutoQuote"
echo "========================================"

# Test 1: GET /api/config
echo -e "\n${YELLOW}Test 1: GET /api/config${NC}"
RESPONSE=$(curl -s "$BASE_URL/config")
if echo "$RESPONSE" | grep -q "appName"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
fi

# Test 2: POST /api/generate-quote
echo -e "\n${YELLOW}Test 2: POST /api/generate-quote${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/generate-quote" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Cliente",
    "clientEmail": "test@example.com",
    "projectDescription": "Sitio web corporativo",
    "priceRange": "50000 - 80000"
  }')
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
    QUOTE_ID=$(echo "$RESPONSE" | grep -o '"quoteId":[0-9]*' | grep -o '[0-9]*' | head -1)
    echo "   Quote ID: $QUOTE_ID"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
    QUOTE_ID="1"
fi

# Test 3: GET /api/quotes
echo -e "\n${YELLOW}Test 3: GET /api/quotes${NC}"
RESPONSE=$(curl -s "$BASE_URL/quotes")
if echo "$RESPONSE" | grep -q "quotes"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
fi

# Test 4: GET /api/quotes/:id
echo -e "\n${YELLOW}Test 4: GET /api/quotes/$QUOTE_ID${NC}"
RESPONSE=$(curl -s "$BASE_URL/quotes/$QUOTE_ID")
if echo "$RESPONSE" | grep -q "quote"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
fi

# Test 5: POST /api/quotes/:id/mark-sent
echo -e "\n${YELLOW}Test 5: POST /api/quotes/$QUOTE_ID/mark-sent${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/quotes/$QUOTE_ID/mark-sent")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
fi

# Test 6: POST /api/quotes/:id/accept
echo -e "\n${YELLOW}Test 6: POST /api/quotes/$QUOTE_ID/accept${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/quotes/$QUOTE_ID/accept")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
fi

# Test 7: POST /api/quotes/:id/send-email
echo -e "\n${YELLOW}Test 7: POST /api/quotes/$QUOTE_ID/send-email${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/quotes/$QUOTE_ID/send-email")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
    TOKEN=$(echo "$RESPONSE" | grep -o '"link":"[^"]*' | grep -o 'token=[^"]*' | cut -d= -f2)
    if [ ! -z "$TOKEN" ]; then
        echo "   Token generado: ${TOKEN:0:20}..."
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$RESPONSE"
    TOKEN="test_token"
fi

# Test 8: GET /api/quotes/view/:token (solo si hay token)
if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "test_token" ]; then
    echo -e "\n${YELLOW}Test 8: GET /api/quotes/view/$TOKEN${NC}"
    RESPONSE=$(curl -s "$BASE_URL/quotes/view/$TOKEN")
    if echo "$RESPONSE" | grep -q "quote"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "$RESPONSE"
    fi
fi

echo -e "\n========================================"
echo -e "${GREEN}✅ Pruebas completadas${NC}"
echo "Revisa los resultados arriba. Verifica manualmente los PDFs y emails."

