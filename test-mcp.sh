#!/bin/bash

# Variables de configuración
EVOLUTION_URL="https://evolution-api-evolution-api.dqyvuv.easypanel.host"
MCP_URL="https://mcp-evolution-api-fixed-production.up.railway.app"
API_KEY="BC10D87095B7-44E2-B1A4-F03BE2BECE24"
INSTANCE="Luis2"
PHONE_NUMBER="554198908495"

echo "=========================================="
echo "Evolution API & MCP Server Test Script"
echo "=========================================="
echo ""

# 1. Verificar el estado del MCP Server
echo "1. Verificando MCP Server..."
echo "   URL: $MCP_URL"
curl -s "$MCP_URL/" | jq '.'
echo ""

# 2. Verificar el estado de las instancias a través del MCP
echo "2. Obteniendo instancias desde MCP Server..."
curl -s -X GET "$MCP_URL/api/instances" \
  -H "X-API-Key: $API_KEY" | jq '.'
echo ""

# 3. Verificar el estado de la instancia específica
echo "3. Verificando estado de la instancia $INSTANCE..."
curl -s -X GET "$MCP_URL/api/instances/$INSTANCE/status" \
  -H "X-API-Key: $API_KEY" | jq '.'
echo ""

# 4. Verificar si el número tiene WhatsApp
echo "4. Verificando si el número tiene WhatsApp..."
curl -s -X POST "$MCP_URL/api/check-numbers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"instanceName\": \"$INSTANCE\",
    \"numbers\": [\"$PHONE_NUMBER\"]
  }" | jq '.'
echo ""

# 5. Enviar mensaje de prueba
echo "5. Enviando mensaje de prueba..."
echo "   Instancia: $INSTANCE"
echo "   Número: $PHONE_NUMBER"
echo ""

RESPONSE=$(curl -s -X POST "$MCP_URL/api/send/text" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"instanceName\": \"$INSTANCE\",
    \"number\": \"$PHONE_NUMBER\",
    \"text\": \"🚀 Mensaje de prueba desde MCP Server actualizado!\\n\\nFecha: $(date)\\nInstancia: $INSTANCE\\nServidor: Railway\"
  }")

echo "Respuesta del servidor:"
echo "$RESPONSE" | jq '.'
echo ""

# Verificar si hubo error
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error al enviar el mensaje"
  echo ""
  echo "Posibles causas:"
  echo "1. La instancia no está conectada a WhatsApp"
  echo "2. El número no tiene WhatsApp"
  echo "3. El formato del número es incorrecto"
  echo "4. Problema con el API Key"
else
  echo "✅ Mensaje enviado exitosamente!"
fi

echo ""
echo "=========================================="
echo "Prueba completada"
echo "=========================================="
