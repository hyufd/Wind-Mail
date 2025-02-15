import { SMTPConfig } from './storage';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  campaignName?: string;
}

export async function sendEmail(config: SMTPConfig, options: EmailOptions): Promise<boolean> {
  try {
    // Validate required fields before making the request
    if (!options.to || !options.subject || (!options.text && !options.html)) {
      throw new Error('Missing required email fields');
    }

    if (!config.host || !config.port || !config.username || !config.password) {
      throw new Error('Invalid SMTP configuration');
    }

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, options }),
      // Add these options to improve fetch behavior
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error: any) {
    console.error('Error sending email:', error.message);
    throw error; // Propagate the error for better error handling
  }
}