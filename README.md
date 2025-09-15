# Evolution API MCP Server

MCP Server para Evolution API (WhatsApp Business API) con soporte de plantillas de mensajes dinámicas.

## Características

### ✅ Gestión de Instancias WhatsApp
- Crear, conectar y eliminar instancias
- Verificar estado de conexión
- Gestionar múltiples cuentas

### 📨 Mensajería Avanzada
- Envío de texto, media, botones y listas interactivas
- Sistema de plantillas con variables dinámicas
- Soporte para emojis y formato markdown

### 📋 Plantillas de Mensajes
- **10+ plantillas predefinidas** para casos comunes:
  - Bienvenida
  - Confirmación de pedidos
  - Recordatorios de citas
  - Solicitudes de pago
  - Tickets de soporte
  - Promociones
  - Solicitud de feedback
  - Actualizaciones de envío
  - Menús interactivos

### 👥 Gestión de Contactos y Grupos
- Crear y administrar grupos
- Gestionar participantes
- Verificar números de WhatsApp

## Instalación

### Requisitos
- Node.js 18+
- Evolution API v2.x
- PostgreSQL (opcional)

### Configuración Local

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd evolution-api-mcp-server
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

## Despliegue en la Nube

### Docker Compose (Recomendado)

```bash
docker-compose up -d
```

Incluye:
- Evolution API
- PostgreSQL
- MCP Server

### Railway

1. Conectar repositorio a Railway
2. Configurar variables de entorno:
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
3. Deploy automático

### Vercel

```bash
vercel deploy
```

### Configuración Manual en VPS

1. Instalar Node.js y PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

2. Clonar y configurar:
```bash
git clone <repo-url>
cd evolution-api-mcp-server
npm install
npm run build
```

3. Iniciar con PM2:
```bash
pm2 start dist/index.js --name evolution-mcp
pm2 save
pm2 startup
```

## Uso con Claude Code

### Configuración en Claude Code

1. Agregar a `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "evolution-api": {
      "command": "node",
      "args": ["/path/to/evolution-api-mcp-server/dist/index.js"],
      "env": {
        "EVOLUTION_API_URL": "http://your-server:8080",
        "EVOLUTION_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Ejemplos de Uso

#### Crear instancia y conectar:
```
create_instance({ instanceName: "mybot", qrcode: true })
```

#### Enviar mensaje con plantilla:
```
send_template({
  instanceName: "mybot",
  number: "5511999999999",
  templateId: "welcome",
  variables: {
    name: "Juan",
    company: "Mi Empresa",
    agent: "Bot Assistant"
  }
})
```

#### Crear plantilla personalizada:
```
create_template({
  name: "Custom Welcome",
  text: "Hola {{name}}, bienvenido a {{company}}!",
  variables: ["name", "company"],
  category: "greetings"
})
```

## API Endpoints (HTTP Mode)

El servidor también expone endpoints HTTP para uso directo:

- `GET /health` - Estado del servidor
- `POST /mcp` - Endpoint MCP principal

## Plantillas Disponibles

| ID | Categoría | Descripción |
|---|---|---|
| welcome | greetings | Mensaje de bienvenida |
| order-confirmation | ecommerce | Confirmación de pedido |
| appointment-reminder | scheduling | Recordatorio de cita |
| payment-request | billing | Solicitud de pago |
| support-ticket | support | Ticket de soporte |
| promotional | marketing | Mensaje promocional |
| feedback-request | feedback | Solicitud de feedback |
| shipping-update | logistics | Actualización de envío |
| menu-list | interactive | Menú interactivo |

## Variables de Entorno

| Variable | Descripción | Default |
|---|---|---|
| EVOLUTION_API_URL | URL de Evolution API | http://localhost:8080 |
| EVOLUTION_API_KEY | API Key global | - |
| MCP_SERVER_PORT | Puerto del servidor HTTP | 3000 |
| TEMPLATE_STORAGE | Tipo de almacenamiento | json |
| NODE_ENV | Entorno | development |

## Estructura del Proyecto

```
evolution-api-mcp-server/
├── src/
│   ├── index.ts              # Servidor principal
│   ├── services/
│   │   ├── evolution-api.ts  # Cliente Evolution API
│   │   └── template-service.ts # Gestión de plantillas
│   └── types/
│       ├── evolution.ts      # Tipos Evolution API
│       └── templates.ts      # Tipos y plantillas default
├── templates/                # Plantillas personalizadas
├── docker-compose.yml        # Stack completo
├── Dockerfile               # Imagen Docker
├── railway.json            # Config Railway
└── vercel.json            # Config Vercel
```

## Seguridad

- API Key requerida para todas las operaciones
- Variables sensibles en `.env`
- HTTPS recomendado en producción
- Rate limiting configurable

## Desarrollo

### Agregar nuevas plantillas:

1. Editar `src/types/templates.ts`
2. Agregar a `DEFAULT_TEMPLATES`
3. Rebuild: `npm run build`

### Extender funcionalidad:

1. Agregar tool en `src/index.ts`
2. Implementar handler
3. Actualizar tipos si es necesario

## Soporte

- Evolution API Docs: https://doc.evolution-api.com
- MCP Protocol: https://modelcontextprotocol.io

## Licencia

MIT