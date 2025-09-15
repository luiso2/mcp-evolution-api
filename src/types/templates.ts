export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  language?: string;
  content: {
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
  };
  variables?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateVariable {
  key: string;
  value: string | number | boolean;
  description?: string;
}

export interface TemplateUsage {
  templateId: string;
  variables: Record<string, any>;
  to: string;
  instance?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    category: 'greetings',
    description: 'Welcome message for new contacts',
    content: {
      text: 'Hello {{name}}! 👋\n\nWelcome to {{company}}!\n\nWe are happy to have you here. How can we help you today?\n\nBest regards,\n{{agent}}'
    },
    variables: ['name', 'company', 'agent'],
    tags: ['welcome', 'greeting', 'new-user']
  },
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    category: 'ecommerce',
    description: 'Confirm order placement',
    content: {
      text: '✅ *Order Confirmed!*\n\nHi {{customerName}},\n\nYour order #{{orderId}} has been confirmed.\n\n📦 *Items:*\n{{items}}\n\n💰 *Total:* {{total}}\n\n📍 *Delivery Address:*\n{{address}}\n\n📅 *Estimated Delivery:* {{deliveryDate}}\n\nThank you for your purchase!'
    },
    variables: ['customerName', 'orderId', 'items', 'total', 'address', 'deliveryDate'],
    tags: ['order', 'confirmation', 'ecommerce']
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    category: 'scheduling',
    description: 'Remind about upcoming appointment',
    content: {
      text: '📅 *Appointment Reminder*\n\nHello {{patientName}},\n\nThis is a reminder about your appointment:\n\n👨‍⚕️ *Doctor:* {{doctorName}}\n📍 *Location:* {{clinic}}\n📅 *Date:* {{date}}\n⏰ *Time:* {{time}}\n\n⚠️ Please arrive 15 minutes early.\n\nTo confirm, reply with *YES*\nTo reschedule, reply with *RESCHEDULE*\n\nThank you!'
    },
    variables: ['patientName', 'doctorName', 'clinic', 'date', 'time'],
    tags: ['appointment', 'reminder', 'healthcare']
  },
  {
    id: 'payment-request',
    name: 'Payment Request',
    category: 'billing',
    description: 'Request payment from customer',
    content: {
      text: '💳 *Payment Request*\n\nDear {{customerName}},\n\n*Invoice #{{invoiceNumber}}*\n*Amount Due:* {{amount}}\n*Due Date:* {{dueDate}}\n\n{{description}}\n\n*Payment Methods:*\n✅ PIX: {{pixKey}}\n✅ Bank Transfer\n✅ Credit Card\n\nClick here to pay: {{paymentLink}}\n\nQuestions? Reply to this message.'
    },
    variables: ['customerName', 'invoiceNumber', 'amount', 'dueDate', 'description', 'pixKey', 'paymentLink'],
    tags: ['payment', 'invoice', 'billing']
  },
  {
    id: 'support-ticket',
    name: 'Support Ticket',
    category: 'support',
    description: 'Create support ticket confirmation',
    content: {
      text: '🎫 *Support Ticket Created*\n\n*Ticket ID:* #{{ticketId}}\n*Status:* {{status}}\n*Priority:* {{priority}}\n\n*Issue:*\n{{issueDescription}}\n\n*Next Steps:*\n{{nextSteps}}\n\n*Expected Resolution:* {{expectedTime}}\n\nWe will keep you updated on the progress.\n\nSupport Team'
    },
    variables: ['ticketId', 'status', 'priority', 'issueDescription', 'nextSteps', 'expectedTime'],
    tags: ['support', 'ticket', 'customer-service']
  },
  {
    id: 'promotional',
    name: 'Promotional Message',
    category: 'marketing',
    description: 'Send promotional offers',
    content: {
      text: '🎉 *{{title}}* 🎉\n\n{{description}}\n\n✨ *Offer Details:*\n{{offerDetails}}\n\n🏷️ *Discount Code:* {{promoCode}}\n⏳ *Valid Until:* {{validUntil}}\n\n🛒 Shop Now: {{shopLink}}\n\n_Terms and conditions apply_'
    },
    variables: ['title', 'description', 'offerDetails', 'promoCode', 'validUntil', 'shopLink'],
    tags: ['promotion', 'marketing', 'offer']
  },
  {
    id: 'feedback-request',
    name: 'Feedback Request',
    category: 'feedback',
    description: 'Request customer feedback',
    content: {
      text: '⭐ *How was your experience?*\n\nHi {{customerName}},\n\nThank you for {{action}}!\n\nWe would love to hear your feedback:\n\n{{feedbackQuestion}}\n\nRate us:\n⭐⭐⭐⭐⭐\n\nYour feedback link: {{feedbackLink}}\n\nThank you for helping us improve!'
    },
    variables: ['customerName', 'action', 'feedbackQuestion', 'feedbackLink'],
    tags: ['feedback', 'survey', 'rating']
  },
  {
    id: 'shipping-update',
    name: 'Shipping Update',
    category: 'logistics',
    description: 'Update on shipping status',
    content: {
      text: '📦 *Shipping Update*\n\n*Order #{{orderId}}*\n\n*Status:* {{status}}\n*Carrier:* {{carrier}}\n*Tracking:* {{trackingNumber}}\n\n*Current Location:* {{currentLocation}}\n*Next Stop:* {{nextStop}}\n\n*Estimated Delivery:* {{estimatedDelivery}}\n\nTrack your order: {{trackingLink}}'
    },
    variables: ['orderId', 'status', 'carrier', 'trackingNumber', 'currentLocation', 'nextStop', 'estimatedDelivery', 'trackingLink'],
    tags: ['shipping', 'tracking', 'delivery']
  },
  {
    id: 'menu-list',
    name: 'Interactive Menu',
    category: 'interactive',
    description: 'Interactive menu with options',
    content: {
      listMessage: {
        title: '{{title}}',
        description: '{{description}}',
        buttonText: '{{buttonText}}',
        footerText: '{{footer}}',
        sections: [
          {
            title: 'Main Options',
            rows: [
              {
                title: '📱 Products',
                description: 'View our products',
                rowId: 'products'
              },
              {
                title: '💬 Support',
                description: 'Talk to support',
                rowId: 'support'
              },
              {
                title: '📍 Location',
                description: 'Our addresses',
                rowId: 'location'
              }
            ]
          }
        ]
      }
    },
    variables: ['title', 'description', 'buttonText', 'footer'],
    tags: ['menu', 'interactive', 'list']
  }
];