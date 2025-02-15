"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, Download, Upload } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { 
  SMTPConfig, 
  saveSMTPConfig, 
  getSMTPConfig,
  getMailList,
  saveMailList,
  getEmailLogs,
  saveEmailLog,
  getMailDrafts,
  saveMailDraft,
  EmailLog,
  MailDraft,
  EmailRecipient
} from '@/lib/storage';
import { useTheme } from "next-themes";

interface ValidationErrors {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
}

interface ExportData {
  smtp: SMTPConfig | null;
  theme: string | undefined;
  mailList: EmailRecipient[];
  emailLogs: EmailLog[];
  mailDrafts: MailDraft[];
  exportDate: string;
  version: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [useSSL, setUseSSL] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [mounted, setMounted] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: '',
    port: '',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    useSSL: true,
  });

  useEffect(() => {
    const savedConfig = getSMTPConfig();
    if (savedConfig) {
      setSmtpConfig(savedConfig);
      setUseSSL(savedConfig.useSSL);
    }
    setMounted(true);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePort = (port: string): boolean => {
    const portNumber = parseInt(port, 10);
    return !isNaN(portNumber) && portNumber > 0 && portNumber <= 65535;
  };

  const validateHost = (host: string): boolean => {
    const hostRegex = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return hostRegex.test(host);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSmtpConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!smtpConfig.host) {
      newErrors.host = 'SMTP host is required';
    } else if (!validateHost(smtpConfig.host)) {
      newErrors.host = 'Invalid SMTP host format';
    }

    if (!smtpConfig.port) {
      newErrors.port = 'Port is required';
    } else if (!validatePort(smtpConfig.port)) {
      newErrors.port = 'Port must be a number between 1 and 65535';
    }

    if (!smtpConfig.username) {
      newErrors.username = 'Username is required';
    }

    if (!smtpConfig.password) {
      newErrors.password = 'Password is required';
    }

    if (!smtpConfig.fromEmail) {
      newErrors.fromEmail = 'From email is required';
    } else if (!validateEmail(smtpConfig.fromEmail)) {
      newErrors.fromEmail = 'Invalid email format';
    }

    if (!smtpConfig.fromName) {
      newErrors.fromName = 'From name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    const configToSave = { ...smtpConfig, useSSL };
    saveSMTPConfig(configToSave);
    
    toast({
      title: "Settings Saved",
      description: "Your SMTP configuration has been saved successfully.",
    });
  };

  const handleExport = () => {
    const exportData: ExportData = {
      smtp: getSMTPConfig(),
      theme: theme,
      mailList: getMailList(),
      emailLogs: getEmailLogs(),
      mailDrafts: getMailDrafts(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wind-mail-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Created",
      description: "All your data has been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content) as ExportData;
          
          // Validate the imported data structure
          if (!importData.version) {
            throw new Error('Invalid backup file format');
          }

          // Import SMTP settings
          if (importData.smtp) {
            setSmtpConfig(importData.smtp);
            setUseSSL(importData.smtp.useSSL);
            saveSMTPConfig(importData.smtp);
          }
          
          // Import theme
          if (importData.theme) {
            setTheme(importData.theme);
          }

          // Import mail list
          if (Array.isArray(importData.mailList)) {
            saveMailList(importData.mailList);
          }

          // Import email logs
          if (Array.isArray(importData.emailLogs)) {
            // Clear existing logs and import new ones
            localStorage.setItem('email_logs', JSON.stringify(importData.emailLogs));
          }

          // Import mail drafts
          if (Array.isArray(importData.mailDrafts)) {
            // Clear existing drafts and import new ones
            localStorage.setItem('mail_drafts', JSON.stringify(importData.mailDrafts));
          }

          toast({
            title: "Backup Restored",
            description: "All your data has been imported successfully.",
          });
        } catch (error) {
          console.error('Import error:', error);
          toast({
            title: "Import Error",
            description: "Failed to import backup. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold text-primary">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Backup
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Backup
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">SMTP Configuration</h2>
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-sm font-semibold mb-2">How to Configure Your Email Server</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>For Gmail:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Host: smtp.gmail.com</li>
                    <li>Port: 587 (TLS) or 465 (SSL)</li>
                    <li>Username: Your full Gmail address</li>
                    <li>Password: Your app-specific password (2FA required)</li>
                  </ul>
                  
                  <p className="mt-3"><strong>For Outlook/Office 365:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Host: smtp.office365.com</li>
                    <li>Port: 587</li>
                    <li>Username: Your full email address</li>
                    <li>Password: Your account password or app password</li>
                  </ul>

                  <p className="mt-3"><strong>Important Notes:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>For Gmail, you need to enable 2FA and generate an app password</li>
                    <li>The "From Email" should match your authenticated email address</li>
                    <li>Test your configuration with a small recipient list first</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP Host</Label>
                    <Input
                      id="host"
                      name="host"
                      placeholder="smtp.example.com"
                      value={smtpConfig.host}
                      onChange={handleChange}
                      className={errors.host ? "border-destructive" : ""}
                      required
                    />
                    {errors.host && (
                      <p className="text-sm text-destructive">{errors.host}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">SMTP Port</Label>
                    <Input
                      id="port"
                      name="port"
                      placeholder="587"
                      type="number"
                      value={smtpConfig.port}
                      onChange={handleChange}
                      className={errors.port ? "border-destructive" : ""}
                      required
                    />
                    {errors.port && (
                      <p className="text-sm text-destructive">{errors.port}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="your@email.com"
                      value={smtpConfig.username}
                      onChange={handleChange}
                      className={errors.username ? "border-destructive" : ""}
                      required
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={smtpConfig.password}
                      onChange={handleChange}
                      className={errors.password ? "border-destructive" : ""}
                      required
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      name="fromEmail"
                      placeholder="noreply@company.com"
                      type="email"
                      value={smtpConfig.fromEmail}
                      onChange={handleChange}
                      className={errors.fromEmail ? "border-destructive" : ""}
                      required
                    />
                    {errors.fromEmail && (
                      <p className="text-sm text-destructive">{errors.fromEmail}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      placeholder="Company Name"
                      value={smtpConfig.fromName}
                      onChange={handleChange}
                      className={errors.fromName ? "border-destructive" : ""}
                      required
                    />
                    {errors.fromName && (
                      <p className="text-sm text-destructive">{errors.fromName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ssl-mode"
                    checked={useSSL}
                    onCheckedChange={setUseSSL}
                  />
                  <Label htmlFor="ssl-mode">Use SSL/TLS</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button type="submit">
                Save Settings
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}