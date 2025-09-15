// Evolution API MCP Dashboard JavaScript

class Dashboard {
    constructor() {
        this.apiBase = window.location.origin;
        this.instances = [];
        this.currentTab = 'dashboard';
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
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
                this.loadWebhooks();
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

    loadWebhooks() {
        // Implement webhook management
        console.log('Loading webhooks...');
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
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});