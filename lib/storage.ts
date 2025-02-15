// Local Storage Keys
const STORAGE_KEYS = {
  SMTP_CONFIG: 'smtp_config',
  MAIL_LIST: 'mail_list',
  EMAIL_LOGS: 'email_logs',
  MAIL_DRAFTS: 'mail_drafts',
} as const;

export interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useSSL: boolean;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string;
  addedAt: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  status: 'success' | 'failed';
  error?: string;
  campaignName?: string;
}

export interface MailDraft {
  id: string;
  campaignName: string;
  subject: string;
  content: string;
  isHTML: boolean;
  createdAt: string;
  updatedAt: string;
}

// SMTP Configuration Storage
export const saveSMTPConfig = (config: SMTPConfig): void => {
  localStorage.setItem(STORAGE_KEYS.SMTP_CONFIG, JSON.stringify(config));
};

export const getSMTPConfig = (): SMTPConfig | null => {
  const config = localStorage.getItem(STORAGE_KEYS.SMTP_CONFIG);
  return config ? JSON.parse(config) : null;
};

// Mail List Storage
export const saveMailList = (list: EmailRecipient[]): void => {
  localStorage.setItem(STORAGE_KEYS.MAIL_LIST, JSON.stringify(list));
};

export const getMailList = (): EmailRecipient[] => {
  const list = localStorage.getItem(STORAGE_KEYS.MAIL_LIST);
  return list ? JSON.parse(list) : [];
};

// Email Logs Storage
export function saveEmailLog(log: Omit<EmailLog, 'id' | 'timestamp'>): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  const currentLogs = getEmailLogs();
  const newLog: EmailLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  currentLogs.unshift(newLog); // Add new logs at the beginning
  localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(currentLogs));
}

export function getEmailLogs(): EmailLog[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  const logs = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
  return logs ? JSON.parse(logs) : [];
}

export function clearEmailLogs(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify([]));
}

// Mail Drafts Storage
export const saveMailDraft = (draft: Omit<MailDraft, 'id' | 'createdAt' | 'updatedAt'>): void => {
  const drafts = getMailDrafts();
  const newDraft: MailDraft = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  drafts.push(newDraft);
  localStorage.setItem(STORAGE_KEYS.MAIL_DRAFTS, JSON.stringify(drafts));
};

export const updateMailDraft = (draft: MailDraft): void => {
  const drafts = getMailDrafts();
  const index = drafts.findIndex(d => d.id === draft.id);
  if (index !== -1) {
    drafts[index] = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.MAIL_DRAFTS, JSON.stringify(drafts));
  }
};

export const deleteMailDraft = (id: string): void => {
  const drafts = getMailDrafts();
  const filteredDrafts = drafts.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.MAIL_DRAFTS, JSON.stringify(filteredDrafts));
};

export const getMailDrafts = (): MailDraft[] => {
  const drafts = localStorage.getItem(STORAGE_KEYS.MAIL_DRAFTS);
  return drafts ? JSON.parse(drafts) : [];
};