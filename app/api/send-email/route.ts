import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SMTPConfig, saveEmailLog } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function validateSMTPConfig(config: any): ValidationResult {
  if (!config) {
    return { isValid: false, error: 'SMTP configuration is missing' };
  }

  const requiredFields = {
    host: 'SMTP host',
    port: 'SMTP port',
    username: 'Username',
    password: 'Password',
    fromEmail: 'From email',
    fromName: 'From name'
  };

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!config[field]) {
      return { isValid: false, error: `${label} is required` };
    }
  }

  // Validate port number
  const port = parseInt(config.port);
  if (isNaN(port) || port < 1 || port > 65535) {
    return { isValid: false, error: 'Invalid SMTP port number' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.fromEmail)) {
    return { isValid: false, error: 'Invalid from email address format' };
  }

  return { isValid: true };
}

function validateEmailOptions(options: any): ValidationResult {
  if (!options) {
    return { isValid: false, error: 'Email options are missing' };
  }

  if (!options.to) {
    return { isValid: false, error: 'Recipient email is required' };
  }

  if (!options.subject) {
    return { isValid: false, error: 'Email subject is required' };
  }

  if (!options.text && !options.html) {
    return { isValid: false, error: 'Email content is required' };
  }

  // Validate recipient email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    return { isValid: false, error: 'Invalid recipient email address format' };
  }

  return { isValid: true };
}

function getTransporterConfig(config: SMTPConfig) {
  const port = config.port;
  const isGmail = config.host.includes('gmail.com');
  const isOutlook = config.host.includes('outlook.com') || config.host.includes('office365.com');
  
  // Base configuration
  const transportConfig: any = {
    host: config.host,
    port: parseInt(port),
    secure: port === '465',
    auth: {
      user: config.username,
      pass: config.password,
    },
    // Disable connection pool for more reliable connections
    pool: false,
    // Short timeouts for faster failure detection
    connectionTimeout: 10000,    // 10 seconds
    greetingTimeout: 10000,     // 10 seconds
    socketTimeout: 10000,       // 10 seconds
  };

  // Provider-specific configurations
  if (isGmail) {
    transportConfig.service = 'gmail';
    transportConfig.secure = true;
    transportConfig.tls = {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    };
  } else if (isOutlook) {
    transportConfig.secure = false; // Outlook uses STARTTLS
    transportConfig.tls = {
      ciphers: 'SSLv3',
      rejectUnauthorized: true
    };
  } else {
    transportConfig.tls = {
      rejectUnauthorized: false, // Allow self-signed certificates for other providers
      minVersion: 'TLSv1.2'
    };
  }

  return transportConfig;
}

async function verifyConnection(transporter: nodemailer.Transporter) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('SMTP verification timeout'));
    }, 10000); // 10 second timeout

    transporter.verify()
      .then(() => {
        clearTimeout(timeout);
        resolve(true);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function POST(request: Request) {
  let emailOptions;
  let transporter;
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      throw new Error('Invalid request format: Unable to parse JSON body');
    }

    const { config, options } = body;
    emailOptions = options;

    // Validate SMTP configuration
    const configValidation = validateSMTPConfig(config);
    if (!configValidation.isValid) {
      throw new Error(configValidation.error);
    }

    // Validate email options
    const optionsValidation = validateEmailOptions(options);
    if (!optionsValidation.isValid) {
      throw new Error(optionsValidation.error);
    }

    // Create transporter with optimized configuration
    const transporterConfig = getTransporterConfig(config);
    
    // Verify SMTP connection with retries
    let verified = false;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Create a new transporter for each attempt
        transporter = nodemailer.createTransport(transporterConfig);
        
        // Verify the connection
        await verifyConnection(transporter);
        verified = true;
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`SMTP verification attempt ${attempt} failed:`, error.message);
        
        // Clean up the failed transporter
        if (transporter) {
          transporter.close();
        }
        
        if (attempt < 3) {
          // Wait before retry with linear backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!verified) {
      throw new Error(`SMTP verification failed after 3 attempts: ${lastError?.message}`);
    }

    // Send email with timeout
    let info;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        info = await Promise.race([
          transporter!.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            headers: {
              'X-Priority': '3',
              'X-MSMail-Priority': 'Normal',
              'X-Mailer': 'Nodemailer',
              'Message-ID': `<${Date.now()}@${config.host}>`
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Send mail timeout')), 15000)
          )
        ]);
        break;
      } catch (error: any) {
        if (attempt === 2) throw error;
        
        // Clean up and create new transporter for retry
        if (transporter) {
          transporter.close();
        }
        transporter = nodemailer.createTransport(transporterConfig);
        await verifyConnection(transporter);
        
        // Short delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log success
    console.log('Message sent:', info.messageId);

    // Save successful email log
    saveEmailLog({
      to: options.to,
      subject: options.subject,
      status: 'success',
      campaignName: options.campaignName,
    });

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Save failed email log
    if (emailOptions) {
      saveEmailLog({
        to: emailOptions.to || 'Unknown',
        subject: emailOptions.subject || 'Unknown',
        status: 'failed',
        error: error.message || 'Unknown error',
        campaignName: emailOptions.campaignName,
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send email'
      },
      { status: 500 }
    );
  } finally {
    // Always ensure the transporter is closed
    if (transporter) {
      transporter.close();
    }
  }
}