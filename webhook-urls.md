# 🌐 URLs del Webhook para Evolution API

## ✅ URL Pública Activa (Internet)

**URL del túnel público:**
```
https://green-crews-punch.loca.lt/api/webhook
```

### 📋 Configuración en Evolution API

**Endpoint para configurar webhook:**
```bash
POST /webhook/set/{instance}
```

**Payload JSON:**
```json
{
  "url": "https://large-bats-marry.loca.lt/api/webhook",
  "events": ["messages.upsert"],
  "webhook_by_events": false
}
```

**Ejemplo con curl:**
```bash
curl -X POST "https://tu-evolution-api.com/webhook/set/tu-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: tu-api-key" \
  -d '{
    "url": "https://large-bats-marry.loca.lt/api/webhook",
    "events": ["messages.upsert"],
    "webhook_by_events": false
  }'
```

## 🏠 URL Local (Solo para desarrollo)

**URL local:**
```
http://localhost:3000/api/webhook
```

## 🔧 Estado del Sistema

- ✅ Servidor local funcionando en puerto 3000
- ✅ Túnel público activo con localtunnel
- ✅ Webhook endpoint `/api/webhook` respondiendo
- ✅ Procesamiento de eventos `messages.upsert`
- ✅ Detección de comandos (`/status`, `/help`, etc.)
- ✅ Sistema de auto-respuestas funcionando
- ✅ Logging completo de solicitudes

## 🧪 Pruebas Realizadas

- ✅ Webhook local probado
- ✅ Webhook público probado desde internet
- ✅ Respuesta 200 OK confirmada
- ✅ Procesamiento de datos JSON verificado

## 📝 Notas Importantes

1. **URL Temporal:** La URL de localtunnel es temporal y cambiará si reinicias el túnel
2. **Mantener Activo:** Mantén el comando `npx localtunnel --port 3000` ejecutándose
3. **Firewall:** Asegúrate de que el puerto 3000 esté abierto localmente
4. **HTTPS:** La URL del túnel ya incluye HTTPS automáticamente

## 🚀 Comandos Útiles

**Reiniciar túnel:**
```bash
npx localtunnel --port 3000
```

**Probar webhook:**
```bash
node test-public-webhook.js
```

**Ver logs del servidor:**
```bash
npm run dev
```

---

**🎯 URL LISTA PARA USAR:** `https://large-bats-marry.loca.lt/api/webhook`