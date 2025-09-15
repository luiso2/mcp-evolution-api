#!/bin/bash

# Configuración de Webhook para Evolution API
echo "=========================================="
echo "Configuración de Webhook - Evolution API"
echo "=========================================="
echo ""

MCP_URL="https://mcp-evolution-api-fixed-production.up.railway.app"
API_KEY="BC10D87095B7-44E2-B1A4-F03BE2BECE24"
INSTANCE="Luis2"

# 1. Configurar el webhook en Evolution API
echo "1. Configurando webhook para la instancia $INSTANCE..."
echo ""

RESPONSE=$(curl -s -X POST "$MCP_URL/api/webhook/setup" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"instanceName\": \"$INSTANCE\"
  }")

echo "Respuesta:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. Verificar la configuración
echo "2. Verificando configuración del webhook..."
echo ""

CONFIG=$(curl -s -X GET "$MCP_URL/api/webhook/config/$INSTANCE" \
  -H "X-API-Key: $API_KEY")

echo "Configuración actual:"
echo "$CONFIG" | python3 -m json.tool 2>/dev/null || echo "$CONFIG"
echo ""

# 3. Habilitar respuestas automáticas
echo "3. Configurando respuestas automáticas..."
echo ""

# Habilitar respuesta de saludo
curl -s -X POST "$MCP_URL/api/webhook/autoresponse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "greeting",
    "enabled": true,
    "pattern": "^(hola|ola|oi|hello|hi|hey)",
    "response": "¡Hola! 👋 Soy el bot del servidor MCP.\\n\\n¿En qué puedo ayudarte?\\n\\nEscribe /help para ver los comandos disponibles."
  }' | python3 -m json.tool 2>/dev/null

echo "✅ Respuesta de saludo configurada"
echo ""

# Habilitar respuesta de ayuda
curl -s -X POST "$MCP_URL/api/webhook/autoresponse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "help",
    "enabled": true
  }' | python3 -m json.tool 2>/dev/null

echo "✅ Respuesta de ayuda configurada"
echo ""

# 4. Verificar estadísticas
echo "4. Estadísticas del webhook..."
echo ""

STATS=$(curl -s -X GET "$MCP_URL/api/webhook/stats" \
  -H "X-API-Key: $API_KEY")

echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
echo ""

echo "=========================================="
echo "✅ Configuración completada"
echo "=========================================="
echo ""
echo "El webhook está configurado en:"
echo "$MCP_URL/api/webhook/$INSTANCE"
echo ""
echo "Comandos disponibles en WhatsApp:"
echo "  /status - Estado del sistema"
echo "  /info - Información de la instancia"
echo "  /ping - Verificar conexión"
echo "  /help - Mostrar ayuda"
echo "  /mensajes - Ver últimos mensajes"
echo ""
echo "Respuestas automáticas habilitadas:"
echo "  - Saludo (hola, hello, hi, etc.)"
echo "  - Ayuda (/help, ayuda, help)"
