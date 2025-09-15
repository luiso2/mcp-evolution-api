// Evolution API MCP Dashboard JavaScript

class Dashboard {
    constructor() {
        // Verificar autenticación
        this.checkAuthentication();
        
        this.apiBase = window.location.origin;
        this.instances = [];
        this.currentTab = 'dashboard';
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthUI();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Create instance form
        document.getElementById('create-instance-btn').addEventListener('click', () => {
            this.createInstance();
        });

        // Send message form
        document.getElementById('send-message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Auto-refresh toggle
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'instances':
                this.loadInstances();
                break;
            case 'messages':
                this.loadInstancesForSelect();
                break;
            case 'webhooks':
                this.loadWebhooksTab();
                break;
            case 'openai':
                this.loadOpenAITab();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadDashboard() {
        try {
            await this.checkSystemStatus();
            await this.loadStats();
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error cargando el dashboard', 'error');
        }
    }

    async checkSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/health`);
            const data = await response.json();
            
            document.getElementById('status-indicator').textContent = 'Online';
            document.getElementById('status-indicator').className = 'badge bg-success';
            
            // Check Evolution API status
            const evolutionStatus = document.getElementById('evolution-status');
            if (data.evolutionApi) {
                evolutionStatus.textContent = 'Conectado';
                evolutionStatus.className = 'badge bg-success';
            } else {
                evolutionStatus.textContent = 'Desconectado';
                evolutionStatus.className = 'badge bg-danger';
            }
        } catch (error) {
            document.getElementById('status-indicator').textContent = 'Offline';
            document.getElementById('status-indicator').className = 'badge bg-danger';
            
            document.getElementById('evolution-status').textContent = 'Error';
            document.getElementById('evolution-status').className = 'badge bg-danger';
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/api/instances`);
            const instances = await response.json();
            
            const totalInstances = instances.length;
            const connectedInstances = instances.filter(i => i.status === 'connected').length;
            
            document.getElementById('total-instances').textContent = totalInstances;
            document.getElementById('connected-instances').textContent = connectedInstances;
            
            // Mock data for messages and webhooks (implement based on your API)
            document.getElementById('messages-today').textContent = '0';
            document.getElementById('active-webhooks').textContent = '0';
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        
        // Mock recent activity - replace with real data from your API
        const activities = [
            { time: '10:30', action: 'Instancia "main" conectada', type: 'success' },
            { time: '10:25', action: 'Mensaje enviado a +5511999999999', type: 'info' },
            { time: '10:20', action: 'Nueva instancia "test" creada', type: 'info' },
            { time: '10:15', action: 'Webhook configurado', type: 'success' }
        ];
        
        activityContainer.innerHTML = activities.map(activity => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">${activity.time}</small>
                <small class="${activity.type === 'success' ? 'text-success' : 'text-info'}">
                    ${activity.action}
                </small>
            </div>
        `).join('');
    }

    async loadInstances() {
        try {
            const response = await fetch(`${this.apiBase}/api/instances`);
            const instances = await response.json();
            this.instances = instances;
            
            this.renderInstancesTable();
        } catch (error) {
            console.error('Error loading instances:', error);
            this.showToast('Error cargando instancias', 'error');
        }
    }

    renderInstancesTable() {
        const container = document.getElementById('instances-table');
        
        if (this.instances.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay instancias configuradas</p>';
            return;
        }
        
        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Conexión</th>
                            <th>QR Code</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.instances.map(instance => this.renderInstanceRow(instance)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = table;
    }

    renderInstanceRow(instance) {
        const statusBadge = this.getStatusBadge(instance.status);
        const connectionBadge = this.getConnectionBadge(instance.connectionStatus);
        
        return `
            <tr>
                <td><strong>${instance.name}</strong></td>
                <td>${statusBadge}</td>
                <td>${connectionBadge}</td>
                <td>
                    ${instance.qrCode ? 
                        `<button class="btn btn-sm btn-outline-primary" onclick="dashboard.showQRCode('${instance.name}', '${instance.qrCode}')">
                            <i class="fas fa-qrcode"></i> Ver QR
                        </button>` : 
                        '<span class="text-muted">No disponible</span>'
                    }
                </td>
                <td>
                    <div class="instance-actions">
                        ${instance.status === 'disconnected' ? 
                            `<button class="btn btn-sm btn-success" onclick="dashboard.connectInstance('${instance.name}')">
                                <i class="fas fa-play"></i> Conectar
                            </button>` :
                            `<button class="btn btn-sm btn-warning" onclick="dashboard.disconnectInstance('${instance.name}')">
                                <i class="fas fa-pause"></i> Desconectar
                            </button>`
                        }
                        <button class="btn btn-sm btn-info" onclick="dashboard.refreshInstance('${instance.name}')">
                            <i class="fas fa-sync"></i> Actualizar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboard.deleteInstance('${instance.name}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'connected': '<span class="badge bg-success">Conectado</span>',
            'disconnected': '<span class="badge bg-danger">Desconectado</span>',
            'connecting': '<span class="badge bg-warning">Conectando</span>',
            'error': '<span class="badge bg-danger">Error</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
    }

    getConnectionBadge(status) {
        const badges = {
            'open': '<span class="badge bg-success">Abierta</span>',
            'close': '<span class="badge bg-danger">Cerrada</span>',
            'connecting': '<span class="badge bg-warning">Conectando</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
    }

    async loadInstancesForSelect() {
        try {
            const response = await fetch(`${this.apiBase}/api/instances`);
            const instances = await response.json();
            
            const select = document.getElementById('instance-select');
            select.innerHTML = '<option value="">Seleccionar instancia...</option>';
            
            instances.filter(i => i.status === 'connected').forEach(instance => {
                const option = document.createElement('option');
                option.value = instance.name;
                option.textContent = instance.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading instances for select:', error);
        }
    }

    async createInstance() {
        const name = document.getElementById('instance-name').value.trim();
        const token = document.getElementById('instance-token').value.trim();
        
        if (!name) {
            this.showToast('El nombre de la instancia es requerido', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/api/instances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, token })
            });
            
            if (response.ok) {
                this.showToast('Instancia creada exitosamente', 'success');
                document.getElementById('instance-name').value = '';
                document.getElementById('instance-token').value = '';
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('createInstanceModal'));
                modal.hide();
                
                // Refresh instances
                this.loadInstances();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error creando instancia', 'error');
            }
        } catch (error) {
            console.error('Error creating instance:', error);
            this.showToast('Error creando instancia', 'error');
        }
    }

    async connectInstance(name) {
        try {
            const response = await fetch(`${this.apiBase}/api/instances/${name}/connect`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showToast(`Conectando instancia ${name}`, 'success');
                this.loadInstances();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error conectando instancia', 'error');
            }
        } catch (error) {
            console.error('Error connecting instance:', error);
            this.showToast('Error conectando instancia', 'error');
        }
    }

    async disconnectInstance(name) {
        try {
            const response = await fetch(`${this.apiBase}/api/instances/${name}/disconnect`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showToast(`Desconectando instancia ${name}`, 'success');
                this.loadInstances();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error desconectando instancia', 'error');
            }
        } catch (error) {
            console.error('Error disconnecting instance:', error);
            this.showToast('Error desconectando instancia', 'error');
        }
    }

    async refreshInstance(name) {
        try {
            const response = await fetch(`${this.apiBase}/api/instances/${name}/refresh`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showToast(`Actualizando instancia ${name}`, 'success');
                this.loadInstances();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error actualizando instancia', 'error');
            }
        } catch (error) {
            console.error('Error refreshing instance:', error);
            this.showToast('Error actualizando instancia', 'error');
        }
    }

    async deleteInstance(name) {
        if (!confirm(`¿Estás seguro de que quieres eliminar la instancia "${name}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/api/instances/${name}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showToast(`Instancia ${name} eliminada`, 'success');
                this.loadInstances();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error eliminando instancia', 'error');
            }
        } catch (error) {
            console.error('Error deleting instance:', error);
            this.showToast('Error eliminando instancia', 'error');
        }
    }

    showQRCode(instanceName, qrCode) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">QR Code - ${instanceName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="qr-code-container">
                            <img src="${qrCode}" alt="QR Code" class="img-fluid">
                            <p class="mt-3 text-muted">Escanea este código QR con WhatsApp</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    async sendMessage() {
        const instance = document.getElementById('instance-select').value;
        const phone = document.getElementById('phone-number').value.trim();
        const message = document.getElementById('message-text').value.trim();
        
        if (!instance || !phone || !message) {
            this.showToast('Todos los campos son requeridos', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/api/send/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instance,
                    number: phone,
                    text: message
                })
            });
            
            if (response.ok) {
                this.showToast('Mensaje enviado exitosamente', 'success');
                document.getElementById('phone-number').value = '';
                document.getElementById('message-text').value = '';
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error enviando mensaje', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Error enviando mensaje', 'error');
        }
    }

    loadLogs() {
        // Implement log viewing
        console.log('Loading logs...');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.removeChild(toast);
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboard();
            } else if (this.currentTab === 'instances') {
                this.loadInstances();
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Webhook Configuration Methods
    async loadWebhooksTab() {
        await this.loadInstancesForWebhook();
        this.setupWebhookEventHandlers();
        await this.loadWebhookStatus();
    }

    async loadInstancesForWebhook() {
        try {
            const response = await fetch(`${this.apiBase}/api/instances`);
            const data = await response.json();
            
            const select = document.getElementById('webhook-instance');
            select.innerHTML = '<option value="">Seleccionar instancia...</option>';
            
            if (data.instances && data.instances.length > 0) {
                data.instances.forEach(instance => {
                    const option = document.createElement('option');
                    option.value = instance.name;
                    option.textContent = `${instance.name} (${instance.status})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading instances for webhook:', error);
            this.showToast('Error al cargar instancias', 'error');
        }
    }

    setupWebhookEventHandlers() {
        const form = document.getElementById('webhook-config-form');
        const testBtn = document.getElementById('test-webhook-btn');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.configureWebhook();
            });
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testWebhook();
            });
        }
    }

    async configureWebhook() {
        const instance = document.getElementById('webhook-instance').value;
        const url = document.getElementById('webhook-url').value;
        const headersText = document.getElementById('webhook-headers').value;
        
        if (!instance || !url) {
            this.showToast('Instancia y URL son requeridos', 'error');
            return;
        }
        
        // Get selected events
        const events = [];
        document.querySelectorAll('#webhooks-content input[type="checkbox"]:checked').forEach(checkbox => {
            events.push(checkbox.value);
        });
        
        let headers = {};
        if (headersText.trim()) {
            try {
                headers = JSON.parse(headersText);
            } catch (error) {
                this.showToast('Headers JSON inválido', 'error');
                return;
            }
        }
        
        try {
            const response = await fetch(`${this.apiBase}/api/webhook/configure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instance,
                    url,
                    events,
                    headers
                })
            });
            
            if (response.ok) {
                this.showToast('Webhook configurado exitosamente', 'success');
                await this.loadWebhookStatus();
                this.addWebhookEvent('Webhook configurado', 'success');
            } else {
                const error = await response.text();
                this.showToast(`Error: ${error}`, 'error');
            }
        } catch (error) {
            console.error('Error configuring webhook:', error);
            this.showToast('Error al configurar webhook', 'error');
        }
    }

    async testWebhook() {
        const instance = document.getElementById('webhook-instance').value;
        const url = document.getElementById('webhook-url').value;
        
        if (!instance || !url) {
            this.showToast('Instancia y URL son requeridos para la prueba', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/api/webhook/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instance,
                    url
                })
            });
            
            if (response.ok) {
                this.showToast('Webhook probado exitosamente', 'success');
                this.addWebhookEvent('Webhook probado', 'success');
            } else {
                const error = await response.text();
                this.showToast(`Error en prueba: ${error}`, 'error');
                this.addWebhookEvent('Error en prueba de webhook', 'error');
            }
        } catch (error) {
            console.error('Error testing webhook:', error);
            this.showToast('Error al probar webhook', 'error');
            this.addWebhookEvent('Error al probar webhook', 'error');
        }
    }

    async loadWebhookStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/webhook/status`);
            const data = await response.json();
            
            const statusContainer = document.getElementById('webhook-status');
            if (data.configured) {
                statusContainer.innerHTML = `
                    <div class="webhook-status">
                        <span class="webhook-status-indicator ${data.active ? 'active' : 'inactive'}"></span>
                        <div>
                            <div><strong>${data.instance}</strong></div>
                            <div class="text-muted small">${data.url}</div>
                            <div class="text-muted small">Eventos: ${data.events.join(', ')}</div>
                        </div>
                    </div>
                `;
            } else {
                statusContainer.innerHTML = '<div class="text-muted">No configurado</div>';
            }
        } catch (error) {
            console.error('Error loading webhook status:', error);
        }
    }

    addWebhookEvent(message, type = 'info') {
        const eventsContainer = document.getElementById('webhook-events');
        const time = new Date().toLocaleTimeString();
        
        const eventElement = document.createElement('div');
        eventElement.className = `webhook-event ${type}`;
        eventElement.innerHTML = `
            ${message}
            <span class="webhook-event-time">${time}</span>
        `;
        
        // Remove "No hay eventos recientes" message if present
        const noEventsMsg = eventsContainer.querySelector('.text-muted');
        if (noEventsMsg && noEventsMsg.textContent === 'No hay eventos recientes') {
            noEventsMsg.remove();
        }
        
        eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);
        
        // Keep only last 10 events
        const events = eventsContainer.querySelectorAll('.webhook-event');
        if (events.length > 10) {
            events[events.length - 1].remove();
        }
    }

    // OpenAI Configuration Methods
    async loadOpenAITab() {
        console.log('🤖 Loading OpenAI configuration tab');
        this.setupOpenAIEventHandlers();
        await this.loadOpenAIConfig();
        await this.loadOpenAIStats();
    }

    setupOpenAIEventHandlers() {
        // Form submission
        const form = document.getElementById('openai-config-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveOpenAIConfig();
            });
        }

        // Test connection button
        const testBtn = document.getElementById('test-openai');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testOpenAIConnection();
            });
        }

        // API key toggle visibility
        const toggleBtn = document.getElementById('toggle-api-key');
        const apiKeyInput = document.getElementById('openai-api-key');
        if (toggleBtn && apiKeyInput) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = apiKeyInput.type === 'password';
                apiKeyInput.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        }

        // Temperature slider
        const temperatureSlider = document.getElementById('openai-temperature');
        const temperatureValue = document.getElementById('temperature-value');
        if (temperatureSlider && temperatureValue) {
            temperatureSlider.addEventListener('input', (e) => {
                temperatureValue.textContent = e.target.value;
            });
        }
    }

    async loadOpenAIConfig() {
        try {
            const response = await fetch('/api/openai/config');
            if (response.ok) {
                const config = await response.json();
                this.populateOpenAIForm(config);
                this.updateOpenAIStatus('active', 'Configurado correctamente');
            } else {
                this.updateOpenAIStatus('inactive', 'No configurado');
            }
        } catch (error) {
            console.error('Error loading OpenAI config:', error);
            this.updateOpenAIStatus('error', 'Error al cargar configuración');
        }
    }

    populateOpenAIForm(config) {
        const fields = {
            'openai-api-key': config.apiKey ? '••••••••••••••••' : '',
            'openai-model': config.model || 'gpt-3.5-turbo',
            'openai-temperature': config.temperature || 0.7,
            'openai-max-tokens': config.maxTokens || 1000,
            'openai-timeout': config.timeout || 30,
            'openai-system-prompt': config.systemPrompt || '',
            'openai-enabled': config.enabled || false
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });

        // Update temperature display
        const temperatureValue = document.getElementById('temperature-value');
        if (temperatureValue) {
            temperatureValue.textContent = fields['openai-temperature'];
        }

        // Update last update time
        const lastUpdate = document.getElementById('openai-last-update');
        if (lastUpdate && config.lastUpdated) {
            lastUpdate.textContent = new Date(config.lastUpdated).toLocaleString();
        }
    }

    async saveOpenAIConfig() {
        const formData = {
            apiKey: document.getElementById('openai-api-key').value,
            model: document.getElementById('openai-model').value,
            temperature: parseFloat(document.getElementById('openai-temperature').value),
            maxTokens: parseInt(document.getElementById('openai-max-tokens').value),
            timeout: parseInt(document.getElementById('openai-timeout').value),
            systemPrompt: document.getElementById('openai-system-prompt').value,
            enabled: document.getElementById('openai-enabled').checked
        };

        // Validate required fields
        if (!formData.apiKey || formData.apiKey === '••••••••••••••••') {
            this.showToast('Por favor ingresa una API key válida', 'error');
            return;
        }

        if (!formData.apiKey.startsWith('sk-')) {
            this.showToast('La API key debe comenzar con "sk-"', 'error');
            return;
        }

        try {
            const response = await fetch('/api/openai/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Configuración guardada correctamente', 'success');
                this.updateOpenAIStatus('active', 'Configurado correctamente');
                await this.loadOpenAIConfig(); // Reload to show masked API key
            } else {
                this.showToast(result.error || 'Error al guardar configuración', 'error');
            }
        } catch (error) {
            console.error('Error saving OpenAI config:', error);
            this.showToast('Error de conexión al guardar configuración', 'error');
        }
    }

    async testOpenAIConnection() {
        const testBtn = document.getElementById('test-openai');
        const originalText = testBtn.innerHTML;
        
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Probando...';
        testBtn.disabled = true;

        try {
            const response = await fetch('/api/openai/test', {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('✅ Conexión exitosa con OpenAI', 'success');
                this.updateOpenAIStatus('active', 'Conexión verificada');
            } else {
                this.showToast(`❌ Error: ${result.error}`, 'error');
                this.updateOpenAIStatus('error', 'Error de conexión');
            }
        } catch (error) {
            console.error('Error testing OpenAI connection:', error);
            this.showToast('❌ Error de conexión al probar OpenAI', 'error');
            this.updateOpenAIStatus('error', 'Error de conexión');
        } finally {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    updateOpenAIStatus(status, message) {
        const statusElement = document.getElementById('openai-status');
        if (statusElement) {
            const dot = statusElement.querySelector('.status-dot');
            const text = statusElement.querySelector('.status-text');
            
            if (dot && text) {
                dot.className = `status-dot status-${status}`;
                text.textContent = message;
            }
        }
    }

    async loadOpenAIStats() {
        try {
            const response = await fetch('/api/openai/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateOpenAIStats(stats);
            }
        } catch (error) {
            console.error('Error loading OpenAI stats:', error);
        }
    }

    updateOpenAIStats(stats) {
        const elements = {
            'openai-messages-today': stats.messagesToday || 0,
            'openai-tokens-used': stats.tokensUsed || 0,
            'openai-estimated-cost': `$${(stats.estimatedCost || 0).toFixed(4)}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Métodos de autenticación
    checkAuthentication() {
        const ALLOWED_EMAILS = [
            'lbencomo94@gmail.com',
            'vargascorporate@gmail.com'
        ];
        
        const loggedUser = localStorage.getItem('loggedUser');
        
        if (!loggedUser || !ALLOWED_EMAILS.includes(loggedUser)) {
            // Redirigir al login
            window.location.href = '/login.html';
            return;
        }
        
        // Usuario autenticado
        this.currentUser = loggedUser;
    }
    
    setupAuthUI() {
        // Mostrar usuario logueado
        const loggedUserElement = document.getElementById('logged-user');
        if (loggedUserElement && this.currentUser) {
            loggedUserElement.textContent = this.currentUser;
        }
        
        // Configurar botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }
    
    logout() {
        // Confirmar logout
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // Limpiar localStorage
            localStorage.removeItem('loggedUser');
            
            // Mostrar mensaje
            this.showToast('Sesión cerrada exitosamente', 'info');
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});