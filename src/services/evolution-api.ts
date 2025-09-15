import axios, { AxiosInstance } from 'axios';
import {
  Instance,
  Message,
  SendMessageOptions,
  Contact,
  Group,
  WebhookConfig,
  EvolutionConfig
} from '../types/evolution.js';

export class EvolutionAPI {
  private client: AxiosInstance;
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey
      },
      timeout: 30000
    });
  }

  // Instance Management
  async createInstance(data: {
    instanceName: string;
    qrcode?: boolean;
    integration?: string;
    webhookUrl?: string;
    webhookByEvents?: boolean;
    webhookBase64?: boolean;
    webhookHeaders?: Record<string, string>;
  }): Promise<Instance> {
    const response = await this.client.post('/instance/create', data);
    return response.data;
  }

  async fetchInstances(): Promise<Instance[]> {
    const response = await this.client.get('/instance/fetchInstances');
    return response.data;
  }

  async connectInstance(instanceName: string): Promise<Instance> {
    const response = await this.client.get(`/instance/connect/${instanceName}`);
    return response.data;
  }

  async restartInstance(instanceName: string): Promise<{ status: string }> {
    const response = await this.client.put(`/instance/restart/${instanceName}`);
    return response.data;
  }

  async deleteInstance(instanceName: string): Promise<{ status: string }> {
    const response = await this.client.delete(`/instance/delete/${instanceName}`);
    return response.data;
  }

  async logoutInstance(instanceName: string): Promise<{ status: string }> {
    const response = await this.client.delete(`/instance/logout/${instanceName}`);
    return response.data;
  }

  async getConnectionStatus(instanceName: string): Promise<{
    instance: string;
    state: string;
  }> {
    const response = await this.client.get(`/instance/connectionState/${instanceName}`);
    return response.data;
  }

  async setPresence(instanceName: string, presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused'): Promise<any> {
    const response = await this.client.post(`/instance/setPresence/${instanceName}`, {
      presence
    });
    return response.data;
  }

  // Messaging
  async sendText(instanceName: string, data: {
    number: string;
    text: string;
    delay?: number;
    linkPreview?: boolean;
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendText/${instanceName}`, data);
    return response.data;
  }

  async sendMedia(instanceName: string, data: {
    number: string;
    mediatype: 'image' | 'video' | 'audio' | 'document';
    mimetype?: string;
    caption?: string;
    media: string; // base64 or URL
    fileName?: string;
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendMedia/${instanceName}`, data);
    return response.data;
  }

  async sendButtons(instanceName: string, data: {
    number: string;
    title?: string;
    description?: string;
    footer?: string;
    buttons: Array<{
      buttonId: string;
      buttonText: { displayText: string };
    }>;
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendButtons/${instanceName}`, data);
    return response.data;
  }

  async sendList(instanceName: string, data: {
    number: string;
    title?: string;
    description?: string;
    buttonText?: string;
    footerText?: string;
    sections: Array<{
      title: string;
      rows: Array<{
        title: string;
        description?: string;
        rowId: string;
      }>;
    }>;
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendList/${instanceName}`, data);
    return response.data;
  }

  async sendLocation(instanceName: string, data: {
    number: string;
    name?: string;
    address?: string;
    latitude: number;
    longitude: number;
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendLocation/${instanceName}`, data);
    return response.data;
  }

  async sendContact(instanceName: string, data: {
    number: string;
    contact: {
      fullName: string;
      wuid: string;
      phoneNumber: string;
      organization?: string;
    };
  }): Promise<Message> {
    const response = await this.client.post(`/message/sendContact/${instanceName}`, data);
    return response.data;
  }

  async sendReaction(instanceName: string, data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    reaction: string;
  }): Promise<any> {
    const response = await this.client.post(`/message/sendReaction/${instanceName}`, data);
    return response.data;
  }

  // Chat Management
  async findChats(instanceName: string): Promise<any[]> {
    const response = await this.client.get(`/chat/findChats/${instanceName}`);
    return response.data;
  }

  async findMessages(instanceName: string, remoteJid: string, limit: number = 20): Promise<Message[]> {
    const response = await this.client.get(`/chat/findMessages/${instanceName}`, {
      params: { remoteJid, limit }
    });
    return response.data;
  }

  async findStatusMessage(instanceName: string, remoteJid: string, limit: number = 20): Promise<any[]> {
    const response = await this.client.get(`/chat/findStatusMessage/${instanceName}`, {
      params: { remoteJid, limit }
    });
    return response.data;
  }

  async readMessage(instanceName: string, data: {
    remoteJid: string;
    fromMe?: boolean;
    id?: string;
  }): Promise<any> {
    const response = await this.client.post(`/chat/readMessage/${instanceName}`, data);
    return response.data;
  }

  async archiveChat(instanceName: string, data: {
    remoteJid: string;
    archive: boolean;
  }): Promise<any> {
    const response = await this.client.post(`/chat/archiveChat/${instanceName}`, data);
    return response.data;
  }

  async deleteMessage(instanceName: string, data: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  }): Promise<any> {
    const response = await this.client.delete(`/chat/deleteMessage/${instanceName}`, { data });
    return response.data;
  }

  // Contact Management
  async findContacts(instanceName: string): Promise<Contact[]> {
    const response = await this.client.get(`/chat/findContacts/${instanceName}`);
    return response.data;
  }

  async getProfilePicture(instanceName: string, number: string): Promise<{ profilePictureUrl: string }> {
    const response = await this.client.get(`/chat/getProfilePicture/${instanceName}`, {
      params: { number }
    });
    return response.data;
  }

  async getBusinessProfile(instanceName: string, number: string): Promise<any> {
    const response = await this.client.get(`/chat/getBusinessProfile/${instanceName}`, {
      params: { number }
    });
    return response.data;
  }

  async updateProfileName(instanceName: string, name: string): Promise<any> {
    const response = await this.client.post(`/chat/updateProfileName/${instanceName}`, { name });
    return response.data;
  }

  async updateProfilePicture(instanceName: string, image: string): Promise<any> {
    const response = await this.client.post(`/chat/updateProfilePicture/${instanceName}`, { image });
    return response.data;
  }

  async updateProfileStatus(instanceName: string, status: string): Promise<any> {
    const response = await this.client.post(`/chat/updateProfileStatus/${instanceName}`, { status });
    return response.data;
  }

  // Group Management
  async createGroup(instanceName: string, data: {
    subject: string;
    participants: string[];
    description?: string;
  }): Promise<Group> {
    const response = await this.client.post(`/group/create/${instanceName}`, data);
    return response.data;
  }

  async findGroups(instanceName: string, getParticipants?: boolean): Promise<Group[]> {
    const response = await this.client.get(`/group/findGroups/${instanceName}`, {
      params: { getParticipants }
    });
    return response.data;
  }

  async getGroupMembers(instanceName: string, groupJid: string): Promise<any> {
    const response = await this.client.get(`/group/getParticipants/${instanceName}`, {
      params: { groupJid }
    });
    return response.data;
  }

  async updateGroupSubject(instanceName: string, data: {
    groupJid: string;
    subject: string;
  }): Promise<any> {
    const response = await this.client.put(`/group/updateGroupSubject/${instanceName}`, data);
    return response.data;
  }

  async updateGroupDescription(instanceName: string, data: {
    groupJid: string;
    description: string;
  }): Promise<any> {
    const response = await this.client.put(`/group/updateGroupDescription/${instanceName}`, data);
    return response.data;
  }

  async addGroupParticipants(instanceName: string, data: {
    groupJid: string;
    participants: string[];
  }): Promise<any> {
    const response = await this.client.post(`/group/addParticipants/${instanceName}`, data);
    return response.data;
  }

  async removeGroupParticipants(instanceName: string, data: {
    groupJid: string;
    participants: string[];
  }): Promise<any> {
    const response = await this.client.post(`/group/removeParticipants/${instanceName}`, data);
    return response.data;
  }

  async promoteGroupParticipants(instanceName: string, data: {
    groupJid: string;
    participants: string[];
  }): Promise<any> {
    const response = await this.client.post(`/group/promoteParticipants/${instanceName}`, data);
    return response.data;
  }

  async demoteGroupParticipants(instanceName: string, data: {
    groupJid: string;
    participants: string[];
  }): Promise<any> {
    const response = await this.client.post(`/group/demoteParticipants/${instanceName}`, data);
    return response.data;
  }

  async leaveGroup(instanceName: string, groupJid: string): Promise<any> {
    const response = await this.client.post(`/group/leave/${instanceName}`, { groupJid });
    return response.data;
  }

  async getGroupInviteCode(instanceName: string, groupJid: string): Promise<{ inviteCode: string }> {
    const response = await this.client.get(`/group/getInviteCode/${instanceName}`, {
      params: { groupJid }
    });
    return response.data;
  }

  async revokeGroupInviteCode(instanceName: string, groupJid: string): Promise<any> {
    const response = await this.client.post(`/group/revokeInviteCode/${instanceName}`, { groupJid });
    return response.data;
  }

  async acceptGroupInvite(instanceName: string, inviteCode: string): Promise<any> {
    const response = await this.client.post(`/group/acceptInvite/${instanceName}`, { inviteCode });
    return response.data;
  }

  // Webhook Management
  async setWebhook(instanceName: string, config: WebhookConfig): Promise<any> {
    const response = await this.client.post(`/webhook/set/${instanceName}`, config);
    return response.data;
  }

  async getWebhook(instanceName: string): Promise<WebhookConfig> {
    const response = await this.client.get(`/webhook/get/${instanceName}`);
    return response.data;
  }

  // Utility Methods
  async checkNumberStatus(instanceName: string, numbers: string[]): Promise<any[]> {
    const response = await this.client.post(`/chat/checkNumberStatus/${instanceName}`, { numbers });
    return response.data;
  }

  async getBase64FromMediaMessage(instanceName: string, message: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  }): Promise<{ base64: string }> {
    const response = await this.client.post(`/chat/getBase64FromMediaMessage/${instanceName}`, message);
    return response.data;
  }
}