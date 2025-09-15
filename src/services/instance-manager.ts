import { EvolutionAPI } from './evolution-api.js';
import logger from '../utils/logger.js';

export interface WhatsAppInstance {
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_code' | 'error';
  qrCode?: string;
  lastSeen?: Date;
  phoneNumber?: string;
  profileName?: string;
  autoReply: boolean;
  webhookUrl?: string;
}

export class InstanceManager {
  private instances: Map<string, WhatsAppInstance> = new Map();
  private evolutionAPI: EvolutionAPI;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 segundos

  constructor(evolutionAPI: EvolutionAPI) {
    this.evolutionAPI = evolutionAPI;
    this.startStatusMonitoring();
  }

  /**
   * Inicia el monitoreo automático del estado de las instancias
   */
  private startStatusMonitoring(): void {
    logger.info('🔄 Starting instance status monitoring', {
      interval: `${this.CHECK_INTERVAL / 1000}s`
    });

    this.statusCheckInterval = setInterval(async () => {
      await this.updateAllInstancesStatus();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Detiene el monitoreo de estado
   */
  public stopStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      logger.info('⏹️ Instance status monitoring stopped');
    }
  }

  /**
   * Actualiza el estado de todas las instancias
   */
  private async updateAllInstancesStatus(): Promise<void> {
    try {
      const evolutionInstances = await this.evolutionAPI.fetchInstances();
      
      if (!evolutionInstances || !Array.isArray(evolutionInstances)) {
        logger.warn('⚠️ No instances found from Evolution API');
        return;
      }

      logger.debug('🔍 Updating status for all instances', {
        count: evolutionInstances.length
      });

      for (const evolutionInstance of evolutionInstances) {
        await this.updateInstanceStatus(evolutionInstance.instanceName, evolutionInstance);
      }

      // Marcar instancias que ya no existen en Evolution API como desconectadas
      for (const [instanceName, instance] of this.instances) {
        const exists = evolutionInstances.some(ei => ei.instanceName === instanceName);
        if (!exists && instance.status !== 'disconnected') {
          logger.warn('📱 Instance no longer exists in Evolution API', {
            instanceName
          });
          this.updateLocalInstanceStatus(instanceName, 'disconnected');
        }
      }

    } catch (error) {
      logger.error('❌ Failed to update instances status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Actualiza el estado de una instancia específica
   */
  private async updateInstanceStatus(instanceName: string, evolutionData?: any): Promise<void> {
    try {
      let status: WhatsAppInstance['status'] = 'disconnected';
      let qrCode: string | undefined;
      let phoneNumber: string | undefined;
      let profileName: string | undefined;

      if (evolutionData) {
        // Usar datos ya obtenidos
        const connectionStatus = evolutionData.status || 'close';
        status = this.mapEvolutionStatus(connectionStatus);
        phoneNumber = evolutionData.owner;
        profileName = evolutionData.profileName;
      } else {
        // Obtener estado específico de la instancia
        const connectionStatus = await this.evolutionAPI.getConnectionStatus(instanceName);
        status = this.mapEvolutionStatus(connectionStatus.state || 'close');
        phoneNumber = undefined; // No disponible en connectionStatus
        profileName = undefined; // No disponible en connectionStatus
      }

      // Si la instancia necesita QR, usar el QR de evolutionData si está disponible
      if (status === 'qr_code' && evolutionData?.qrcode?.base64) {
        qrCode = evolutionData.qrcode.base64;
      }

      this.updateLocalInstanceStatus(instanceName, status, {
        qrCode,
        phoneNumber,
        profileName,
        lastSeen: new Date()
      });

    } catch (error) {
      logger.error('❌ Failed to update instance status', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.updateLocalInstanceStatus(instanceName, 'error');
    }
  }

  /**
   * Mapea el estado de Evolution API a nuestro formato
   */
  private mapEvolutionStatus(evolutionStatus: string): WhatsAppInstance['status'] {
    switch (evolutionStatus.toLowerCase()) {
      case 'open':
      case 'connected':
        return 'connected';
      case 'connecting':
        return 'connecting';
      case 'qr_code':
      case 'qr':
        return 'qr_code';
      case 'close':
      case 'closed':
      case 'disconnected':
        return 'disconnected';
      default:
        return 'error';
    }
  }

  /**
   * Actualiza el estado local de una instancia
   */
  private updateLocalInstanceStatus(
    instanceName: string, 
    status: WhatsAppInstance['status'],
    additionalData?: Partial<WhatsAppInstance>
  ): void {
    const existingInstance = this.instances.get(instanceName);
    const updatedInstance: WhatsAppInstance = {
      name: instanceName,
      status,
      autoReply: existingInstance?.autoReply ?? true,
      lastSeen: new Date(),
      ...additionalData
    };

    const previousStatus = existingInstance?.status;
    this.instances.set(instanceName, updatedInstance);

    // Log cambios de estado
    if (previousStatus && previousStatus !== status) {
      logger.info('📱 Instance status changed', {
        instanceName,
        previousStatus,
        newStatus: status,
        phoneNumber: updatedInstance.phoneNumber
      });
    }
  }

  /**
   * Crea una nueva instancia de WhatsApp
   */
  public async createInstance(instanceName: string, webhookUrl?: string): Promise<WhatsAppInstance> {
    try {
      logger.info('🆕 Creating new WhatsApp instance', {
        instanceName,
        webhookUrl
      });

      await this.evolutionAPI.createInstance({
        instanceName,
        webhookUrl,
        qrcode: true,
        webhookByEvents: true
      });
      
      const newInstance: WhatsAppInstance = {
        name: instanceName,
        status: 'connecting',
        autoReply: true,
        webhookUrl,
        lastSeen: new Date()
      };

      this.instances.set(instanceName, newInstance);

      // Actualizar estado inmediatamente
      setTimeout(() => {
        this.updateInstanceStatus(instanceName);
      }, 2000);

      logger.info('✅ Instance created successfully', {
        instanceName
      });

      return newInstance;
    } catch (error) {
      logger.error('❌ Failed to create instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Conecta una instancia existente
   */
  public async connectInstance(instanceName: string): Promise<void> {
    try {
      logger.info('🔌 Connecting instance', { instanceName });
      
      await this.evolutionAPI.connectInstance(instanceName);
      this.updateLocalInstanceStatus(instanceName, 'connecting');
      
      // Actualizar estado después de un momento
      setTimeout(() => {
        this.updateInstanceStatus(instanceName);
      }, 3000);

    } catch (error) {
      logger.error('❌ Failed to connect instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.updateLocalInstanceStatus(instanceName, 'error');
      throw error;
    }
  }

  /**
   * Desconecta una instancia
   */
  public async disconnectInstance(instanceName: string): Promise<void> {
    try {
      logger.info('🔌 Disconnecting instance', { instanceName });
      
      await this.evolutionAPI.logoutInstance(instanceName);
      this.updateLocalInstanceStatus(instanceName, 'disconnected');

    } catch (error) {
      logger.error('❌ Failed to disconnect instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Elimina una instancia
   */
  public async deleteInstance(instanceName: string): Promise<void> {
    try {
      logger.info('🗑️ Deleting instance', { instanceName });
      
      await this.evolutionAPI.deleteInstance(instanceName);
      this.instances.delete(instanceName);

      logger.info('✅ Instance deleted successfully', { instanceName });

    } catch (error) {
      logger.error('❌ Failed to delete instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Obtiene todas las instancias
   */
  public getAllInstances(): WhatsAppInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Obtiene una instancia específica
   */
  public getInstance(instanceName: string): WhatsAppInstance | undefined {
    return this.instances.get(instanceName);
  }

  /**
   * Obtiene instancias por estado
   */
  public getInstancesByStatus(status: WhatsAppInstance['status']): WhatsAppInstance[] {
    return this.getAllInstances().filter(instance => instance.status === status);
  }

  /**
   * Configura la respuesta automática para una instancia
   */
  public setAutoReply(instanceName: string, enabled: boolean): void {
    const instance = this.instances.get(instanceName);
    if (instance) {
      instance.autoReply = enabled;
      logger.info('⚙️ Auto-reply setting updated', {
        instanceName,
        enabled
      });
    }
  }

  /**
   * Fuerza la actualización del estado de una instancia
   */
  public async refreshInstanceStatus(instanceName: string): Promise<void> {
    await this.updateInstanceStatus(instanceName);
  }

  /**
   * Obtiene estadísticas de las instancias
   */
  public getInstanceStats(): {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
    qrCode: number;
    error: number;
  } {
    const instances = this.getAllInstances();
    return {
      total: instances.length,
      connected: instances.filter(i => i.status === 'connected').length,
      disconnected: instances.filter(i => i.status === 'disconnected').length,
      connecting: instances.filter(i => i.status === 'connecting').length,
      qrCode: instances.filter(i => i.status === 'qr_code').length,
      error: instances.filter(i => i.status === 'error').length
    };
  }

  /**
   * Limpia recursos al cerrar
   */
  public cleanup(): void {
    this.stopStatusMonitoring();
    logger.info('🧹 Instance manager cleanup completed');
  }
}