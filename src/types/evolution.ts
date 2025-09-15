export interface Instance {
  instanceName: string;
  instanceId?: string;
  qrcode?: {
    base64: string;
    code: string;
  };
  status?: string;
  serverUrl?: string;
  apikey?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  connectedAt?: string;
}

export interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageType: string;
  messageTimestamp: number;
  pushName?: string;
  broadcast?: boolean;
  status?: string;
}

export interface SendMessageOptions {
  number: string;
  text?: string;
  media?: {
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    caption?: string;
  };
  buttons?: Array<{
    buttonId: string;
    buttonText: {
      displayText: string;
    };
  }>;
  templateButtons?: Array<{
    index: number;
    urlButton?: {
      displayText: string;
      url: string;
    };
    callButton?: {
      displayText: string;
      phoneNumber: string;
    };
    quickReplyButton?: {
      displayText: string;
      id: string;
    };
  }>;
  listMessage?: {
    title: string;
    description: string;
    buttonText: string;
    footerText?: string;
    sections: Array<{
      title: string;
      rows: Array<{
        title: string;
        description?: string;
        rowId: string;
      }>;
    }>;
  };
}

export interface Contact {
  id: string;
  pushName?: string;
  name?: string;
  phone?: string;
  profilePictureUrl?: string;
  isMyContact?: boolean;
  isGroup?: boolean;
}

export interface Group {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  size?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descId?: string;
  restrict?: boolean;
  announce?: boolean;
  participants?: Array<{
    id: string;
    admin?: 'admin' | 'superadmin' | null;
  }>;
}

export interface WebhookConfig {
  enabled: boolean;
  url?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  events?: string[];
}

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  defaultInstance?: string;
}