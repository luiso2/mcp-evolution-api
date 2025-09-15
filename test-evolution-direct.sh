#!/bin/bash

# Variables de configuración
EVOLUTION_URL="https://evolution-api-evolution-api.dqyvuv.easypanel.host"
API_KEY="BC10D87095B7-44E2-B1A4-F03BE2BECE24"
INSTANCE="Luis2"
PHONE_NUMBER="554198908495"

echo "=========================================="
echo "Evolution API Direct Test"
echo "=========================================="
echo ""

# 1. Verificar todas las instancias
echo "1. Obteniendo todas las instancias..."
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 2. Verificar estado de conexión
echo "2. Verificando estado de conexión de $INSTANCE..."
curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 3. Intentar conectar la instancia
echo "3. Intentando conectar la instancia..."
curl -s -X GET "$EVOLUTION_URL/instance/connect/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 4. Enviar mensaje directamente
echo "4. Enviando mensaje directamente a Evolution API..."
RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"text\": \"Test directo desde Evolution API - $(date)\"
  }")

echo "Respuesta:"
echo "$RESPONSE" | jq '.'
echo ""

echo "=========================================="
echo "Prueba directa completada"
echo "=========================================="
