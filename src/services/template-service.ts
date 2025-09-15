import { MessageTemplate, TemplateUsage, DEFAULT_TEMPLATES } from '../types/templates.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TemplateService {
  private templates: Map<string, MessageTemplate> = new Map();
  private templatesPath: string;

  constructor(storagePath: string = './templates') {
    this.templatesPath = storagePath;
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
      const customTemplatesFile = path.join(this.templatesPath, 'custom-templates.json');

      try {
        const data = await fs.readFile(customTemplatesFile, 'utf-8');
        const customTemplates = JSON.parse(data) as MessageTemplate[];
        customTemplates.forEach(template => {
          this.templates.set(template.id, template);
        });
      } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(customTemplatesFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error initializing template service:', error);
    }
  }

  async saveCustomTemplates(): Promise<void> {
    const customTemplatesFile = path.join(this.templatesPath, 'custom-templates.json');
    const customTemplates = Array.from(this.templates.values()).filter(
      t => !DEFAULT_TEMPLATES.find(dt => dt.id === t.id)
    );
    await fs.writeFile(customTemplatesFile, JSON.stringify(customTemplates, null, 2));
  }

  /**
   * Replace variables in template content
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  /**
   * Process template content with variables
   */
  processTemplate(template: MessageTemplate, variables: Record<string, any>): any {
    const processedContent: any = {};

    if (template.content.text) {
      processedContent.text = this.replaceVariables(template.content.text, variables);
    }

    if (template.content.media) {
      processedContent.media = {
        ...template.content.media,
        caption: template.content.media.caption
          ? this.replaceVariables(template.content.media.caption, variables)
          : undefined,
        mediaUrl: template.content.media.mediaUrl
          ? this.replaceVariables(template.content.media.mediaUrl, variables)
          : undefined
      };
    }

    if (template.content.buttons) {
      processedContent.buttons = template.content.buttons.map(button => ({
        ...button,
        buttonText: {
          displayText: this.replaceVariables(button.buttonText.displayText, variables)
        }
      }));
    }

    if (template.content.listMessage) {
      const list = template.content.listMessage;
      processedContent.listMessage = {
        title: this.replaceVariables(list.title, variables),
        description: this.replaceVariables(list.description, variables),
        buttonText: this.replaceVariables(list.buttonText, variables),
        footerText: list.footerText
          ? this.replaceVariables(list.footerText, variables)
          : undefined,
        sections: list.sections
      };
    }

    return processedContent;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): MessageTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): MessageTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): MessageTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => t.category === category
    );
  }

  /**
   * Get templates by tags
   */
  getTemplatesByTags(tags: string[]): MessageTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => t.tags && tags.some(tag => t.tags!.includes(tag))
    );
  }

  /**
   * Create new template
   */
  async createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    const id = this.generateTemplateId(template.name);
    const newTemplate: MessageTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(id, newTemplate);
    await this.saveCustomTemplates();
    return newTemplate;
  }

  /**
   * Update existing template
   */
  async updateTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    await this.saveCustomTemplates();
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    // Don't delete default templates
    if (DEFAULT_TEMPLATES.find(t => t.id === id)) {
      return false;
    }

    const deleted = this.templates.delete(id);
    if (deleted) {
      await this.saveCustomTemplates();
    }
    return deleted;
  }

  /**
   * Validate template variables
   */
  validateVariables(template: MessageTemplate, variables: Record<string, any>): string[] {
    const missingVars: string[] = [];

    if (template.variables) {
      template.variables.forEach(varName => {
        if (!(varName in variables)) {
          missingVars.push(varName);
        }
      });
    }

    return missingVars;
  }

  /**
   * Generate template ID from name
   */
  private generateTemplateId(name: string): string {
    const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let id = base;
    let counter = 1;

    while (this.templates.has(id)) {
      id = `${base}-${counter}`;
      counter++;
    }

    return id;
  }

  /**
   * Export templates to JSON
   */
  async exportTemplates(): Promise<string> {
    const templates = Array.from(this.templates.values());
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(jsonData: string): Promise<number> {
    try {
      const templates = JSON.parse(jsonData) as MessageTemplate[];
      let imported = 0;

      for (const template of templates) {
        if (!this.templates.has(template.id)) {
          this.templates.set(template.id, template);
          imported++;
        }
      }

      await this.saveCustomTemplates();
      return imported;
    } catch (error) {
      throw new Error('Invalid template JSON format');
    }
  }

  /**
   * Search templates by text
   */
  searchTemplates(query: string): MessageTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => {
      return (
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        template.category?.toLowerCase().includes(lowerQuery)
      );
    });
  }
}