# 🪝 Webhook System - Evolution API MCP Server

## Descripción

El sistema de webhooks permite recibir y procesar mensajes de WhatsApp en tiempo real. Incluye:
- Recepción de mensajes entrantes
- Respuestas automáticas configurables
- Comandos interactivos
- Almacenamiento temporal de mensajes
- Estadísticas en tiempo real

## Configuración

### 1. Configurar el Webhook en Evolution API

```bash
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/setup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24" \
  -d '{
    "instanceName": "Luis2"
  }'
```

Esto configurará automáticamente el webhook en Evolution API para que envíe eventos a:
```
https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/Luis2
```

### 2. Verificar Configuración

```bash
curl -X GET https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/config/Luis2 \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

## Endpoints Disponibles

### Recepción de Webhooks

#### `POST /api/webhook`
Recibe eventos de cualquier instancia (el instance debe venir en el body).

#### `POST /api/webhook/:instanceName`
Recibe eventos de una instancia específica.

### Gestión de Mensajes

#### `GET /api/webhook/messages`
Obtiene todos los mensajes recibidos (últimos 100).

#### `GET /api/webhook/messages/:instanceName`
Obtiene mensajes de una instancia específica.

Parámetros:
- `limit`: Número de mensajes a retornar (default: 20)

### Respuestas Automáticas

#### `POST /api/webhook/autoresponse`
Configura respuestas automáticas.

**Crear nueva respuesta:**
```json
{
  "name": "despedida",
  "pattern": "^(adios|bye|chau|hasta luego)",
  "response": "¡Hasta luego! 👋 Que tengas un excelente día.",
  "enabled": true
}
```

**Actualizar existente:**
```json
{
  "name": "greeting",
  "enabled": false
}
```

**Listar todas:**
```bash
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/autoresponse \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### Estadísticas

#### `GET /api/webhook/stats`
Obtiene estadísticas de uso del webhook.

Respuesta:
```json
{
  "totalMessages": 42,
  "messagesByInstance": {
    "Luis2": 42
  },
  "messagesByType": {
    "messages.upsert": 40,
    "messages.update": 2
  },
  "recentActivity": [...]
}
```

## Comandos de WhatsApp

Cuando el webhook está activo, los usuarios pueden enviar estos comandos:

| Comando | Descripción |
|---------|-------------|
| `/status` | Muestra el estado del sistema |
| `/info` | Información de la instancia |
| `/ping` | Verifica la conexión |
| `/help` | Muestra comandos disponibles |
| `/mensajes` | Últimos 5 mensajes recibidos |

## Estructura de Eventos

### Mensaje Recibido (messages.upsert)

```json
{
  "event": "messages.upsert",
  "instance": "Luis2",
  "data": {
    "key": {
      "remoteJid": "554198908495@s.whatsapp.net",
      "fromMe": false,
      "id": "MESSAGE_ID"
    },
    "pushName": "Nombre del Contacto",
    "status": "DELIVERY_ACK",
    "message": {
      "conversation": "Texto del mensaje"
    },
    "messageType": "conversation",
    "messageTimestamp": 1757897208,
    "instanceId": "INSTANCE_UUID",
    "source": "android"
  },
  "date_time": "2025-09-14T21:46:48.297Z",
  "server_url": "https://evolution-api-evolution-api.dqyvuv.easypanel.host",
  "apikey": "API_KEY"
}
```

## Ejemplo de Uso Completo

### 1. Configurar Webhook

```bash
# Configurar webhook
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/setup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24" \
  -d '{"instanceName": "Luis2"}'
```

### 2. Habilitar Respuesta Automática

```bash
# Crear respuesta para "gracias"
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/autoresponse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24" \
  -d '{
    "name": "thanks",
    "pattern": "gracias|obrigado|thanks|thank you",
    "response": "¡De nada! 😊 Estoy aquí para ayudarte.",
    "enabled": true
  }'
```

### 3. Verificar Mensajes Recibidos

```bash
# Ver últimos mensajes
curl -X GET https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/messages/Luis2?limit=5 \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 4. Ver Estadísticas

```bash
# Obtener estadísticas
curl -X GET https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/stats \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

## Procesamiento de Eventos

El servidor procesa los siguientes tipos de eventos:

- `messages.upsert` - Nuevo mensaje recibido
- `messages.update` - Mensaje actualizado (ej: leído)
- `messages.delete` - Mensaje eliminado
- `connection.update` - Cambio en el estado de conexión
- `groups.upsert` - Nuevo grupo o cambios
- `groups.update` - Actualización de grupo
- `presence.update` - Actualización de presencia (en línea, escribiendo)

## Seguridad

- Todos los endpoints requieren el header `X-API-Key`
- Los webhooks solo procesan eventos con el API key correcto
- Los mensajes se almacenan temporalmente en memoria (máximo 100)
- No se procesan mensajes propios (fromMe: true)

## Limitaciones

- Máximo 100 mensajes almacenados en memoria
- Las respuestas automáticas tienen un delay de 500-1000ms
- Solo se envía una respuesta automática por mensaje
- Los comandos deben empezar con `/`

## Solución de Problemas

### El webhook no recibe mensajes

1. Verificar que la instancia esté conectada:
```bash
curl -X GET https://mcp-evolution-api-fixed-production.up.railway.app/api/instances/Luis2/status \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

2. Verificar la configuración del webhook:
```bash
curl -X GET https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/config/Luis2 \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

3. Revisar los logs del servidor en Railway

### Las respuestas automáticas no funcionan

1. Verificar que estén habilitadas:
```bash
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/autoresponse \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

2. Verificar el patrón regex
3. Asegurarse de que el mensaje no sea propio (fromMe: false)

## Scripts Útiles

El proyecto incluye el script `setup-webhook.sh` que:
1. Configura el webhook
2. Habilita respuestas automáticas
3. Muestra estadísticas
4. Verifica la configuración

Ejecutar con:
```bash
bash setup-webhook.sh
```

---

**Última actualización:** 14 de Septiembre de 2025
