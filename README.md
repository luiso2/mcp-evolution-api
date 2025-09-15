# Evolution API MCP Server - Guía de Uso

## Configuración Actual

- **URL del Servidor MCP:** https://mcp-evolution-api-fixed-production.up.railway.app
- **URL de Evolution API:** https://evolution-api-evolution-api.dqyvuv.easypanel.host
- **API Key:** BC10D87095B7-44E2-B1A4-F03BE2BECE24
- **Instancia:** Luis2
- **Número de prueba:** 554198908495

## Endpoints Disponibles

### 1. Información del Servidor
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/
```

### 2. Estado de Salud
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/health \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 3. Listar Instancias
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/instances \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 4. Estado de una Instancia
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/instances/Luis2/status \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 5. Enviar Mensaje de Texto
```bash
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/send/text \
  -H "Content-Type: application/json" \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24" \
  -d '{
    "instanceName": "Luis2",
    "number": "554198908495",
    "text": "Hola! Este es un mensaje de prueba"
  }'
```

### 6. Verificar Números de WhatsApp
```bash
curl -X POST https://mcp-evolution-api-fixed-production.up.railway.app/api/check-numbers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24" \
  -d '{
    "instanceName": "Luis2",
    "numbers": ["554198908495", "5541999999999"]
  }'
```

### 7. Listar Contactos
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/instances/Luis2/contacts \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 8. Listar Grupos
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/instances/Luis2/groups \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

### 9. Listar Chats
```bash
curl https://mcp-evolution-api-fixed-production.up.railway.app/api/instances/Luis2/chats \
  -H "X-API-Key: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
```

## Solución de Problemas

### El mensaje no llega a WhatsApp

1. **Verificar que la instancia esté conectada:**
   - La instancia debe tener estado "open" o "connected"
   - Si no está conectada, necesitas escanear el código QR nuevamente

2. **Formato del número:**
   - Brasil: 55 + código de área + número (ejemplo: 554198908495)
   - Sin espacios, guiones o símbolos
   - Sin el símbolo + al inicio

3. **Verificar si el número tiene WhatsApp:**
   - Usa el endpoint `/api/check-numbers` para verificar

### Error "Access denied"

- Verifica que estés enviando el header `X-API-Key` con el valor correcto
- El API Key debe ser: BC10D87095B7-44E2-B1A4-F03BE2BECE24

### Error de conexión

1. Verifica que Evolution API esté funcionando:
   ```bash
   curl https://evolution-api-evolution-api.dqyvuv.easypanel.host/instance/fetchInstances \
     -H "apikey: BC10D87095B7-44E2-B1A4-F03BE2BECE24"
   ```

2. Si Evolution API no responde, el problema está en Easypanel

## Scripts de Prueba

Hay dos scripts de prueba disponibles:

1. **test-mcp.sh** - Prueba el servidor MCP
2. **test-evolution-direct.sh** - Prueba directamente Evolution API

Para ejecutarlos en Windows, usa Git Bash:
```bash
bash test-mcp.sh
bash test-evolution-direct.sh
```

## Actualización del Código

Cuando hagas cambios en el código:

1. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push origin master
   ```

2. Railway detectará automáticamente los cambios y redesplegará

3. Verifica el estado del deployment en Railway:
   - Ve a https://railway.app
   - Entra al proyecto "MCP Servers"
   - Revisa el estado del deployment

## Estructura del Proyecto

```
evolution-api-mcp-server/
├── src/
│   ├── index.ts           # Archivo principal
│   ├── routes/
│   │   └── api.ts         # Rutas HTTP de la API
│   ├── services/
│   │   ├── evolution-api.ts  # Cliente de Evolution API
│   │   └── template-service.ts # Servicio de templates
│   └── types/
│       └── evolution.ts    # Tipos TypeScript
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env                   # Variables de entorno (local)
```

## Variables de Entorno en Railway

Las siguientes variables están configuradas en Railway:

- `EVOLUTION_API_URL`: https://evolution-api-evolution-api.dqyvuv.easypanel.host
- `EVOLUTION_API_KEY`: BC10D87095B7-44E2-B1A4-F03BE2BECE24
- `MCP_SERVER_PORT`: 3000
- `NODE_ENV`: production

## Notas Importantes

1. **Seguridad:** Nunca expongas el API Key en código público
2. **Rate Limiting:** Evolution API puede tener límites de tasa
3. **Sesión de WhatsApp:** La sesión puede expirar y requerir nuevo escaneo de QR
4. **Números bloqueados:** WhatsApp puede bloquear números que envían muchos mensajes

## Contacto y Soporte

Para problemas con:
- **Evolution API:** Revisa la documentación en https://doc.evolution-api.com
- **Railway:** https://railway.app/support
- **Easypanel:** Panel de control de tu instancia

---

Última actualización: 14 de Septiembre de 2025
