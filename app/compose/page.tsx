"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, CheckCircle2, XCircle, Trash2, Save, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  getSMTPConfig, 
  getMailList, 
  getEmailLogs, 
  saveMailDraft, 
  clearEmailLogs,
  getMailDrafts,
  MailDraft,
  saveEmailLog 
} from "@/lib/storage";
import { sendEmail } from "@/lib/mail";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SendingStatus {
  inProgress: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  currentBatch: number;
  totalBatches: number;
}

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
}

const BATCH_SIZE = 50;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export default function ComposePage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');
  const [isHTML, setIsHTML] = useState(false);
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState<string>();
  const [minute, setMinute] = useState<string>();
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sendingStatus, setSendingStatus] = useState<SendingStatus>({
    inProgress: false,
    totalRecipients: 0,
    sentCount: 0,
    failedCount: 0,
    currentBatch: 0,
    totalBatches: 0,
  });
  const [formData, setFormData] = useState({
    campaignName: '',
    subject: '',
    content: '',
  });
  const [emailLogs, setEmailLogs] = useState(getEmailLogs());

  useEffect(() => {
    if (draftId) {
      const draft = getMailDrafts().find(d => d.id === draftId);
      if (draft) {
        setFormData({
          campaignName: draft.campaignName,
          subject: draft.subject,
          content: draft.content,
        });
        setIsHTML(draft.isHTML);
      }
    }
  }, [draftId]);

  useEffect(() => {
    const updateLogs = () => {
      const currentLogs = getEmailLogs();
      if (JSON.stringify(currentLogs) !== JSON.stringify(emailLogs)) {
        setEmailLogs(currentLogs);
      }
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    return () => clearInterval(interval);
  }, [emailLogs]);

  const handleClearLogs = () => {
    clearEmailLogs();
    setEmailLogs([]);
    toast({
      title: "Logs Cleared",
      description: "All email logs have been deleted.",
    });
  };

  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Extract the base64 content without the data URL prefix
        const base64Data = base64Content.split(',')[1];

        setAttachments(prev => [...prev, {
          filename: file.name,
          content: base64Data,
          encoding: 'base64'
        }]);
      } catch (error) {
        toast({
          title: "Attachment Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    // Reset the input
    e.target.value = '';
  };

  const removeAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(att => att.filename !== filename));
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const getScheduledDateTime = () => {
    if (!enableSchedule || !date || !hour || !minute) return null;
    
    const newDate = new Date(date);
    let hourNum = parseInt(hour);
    if (period === "PM" && hourNum !== 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;
    
    newDate.setHours(hourNum, parseInt(minute));
    return newDate;
  };

  const scheduledTime = getScheduledDateTime();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const smtpConfig = getSMTPConfig();
    if (!smtpConfig) {
      toast({
        title: "Configuration Missing",
        description: "Please configure your SMTP settings first.",
        variant: "destructive",
      });
      return;
    }

    const recipients = getMailList();
    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add recipients to your mailing list first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim() || !formData.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both subject and content for your email.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.campaignName.trim()) {
      toast({
        title: "Missing Campaign Name",
        description: "Please provide a name for your campaign.",
        variant: "destructive",
      });
      return;
    }

    const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);

    setSendingStatus({
      inProgress: true,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      currentBatch: 0,
      totalBatches,
    });

    try {
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

        await Promise.all(
          batch.map(async (recipient) => {
            try {
              await sendEmail(smtpConfig, {
                to: recipient.email,
                subject: formData.subject,
                text: !isHTML ? formData.content : undefined,
                html: isHTML ? formData.content : undefined,
                campaignName: formData.campaignName,
                attachments: attachments.length > 0 ? attachments : undefined,
              });

              saveEmailLog({
                to: recipient.email,
                subject: formData.subject,
                status: 'success',
                campaignName: formData.campaignName,
              });

              setSendingStatus(prev => ({
                ...prev,
                currentBatch,
                sentCount: prev.sentCount + 1,
              }));
            } catch (error: any) {
              console.error(`Failed to send email to ${recipient.email}:`, error);

              saveEmailLog({
                to: recipient.email,
                subject: formData.subject,
                status: 'failed',
                error: error.message,
                campaignName: formData.campaignName,
              });

              setSendingStatus(prev => ({
                ...prev,
                currentBatch,
                failedCount: prev.failedCount + 1,
              }));
            }
          })
        );

        if (i + BATCH_SIZE < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Campaign error:', error);
      toast({
        title: "Campaign Error",
        description: "An error occurred while sending the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingStatus(prev => ({ ...prev, inProgress: false }));
      
      toast({
        title: sendingStatus.failedCount === 0 ? "Campaign Completed Successfully" : "Campaign Completed with Errors",
        description: sendingStatus.failedCount === 0
          ? `All ${sendingStatus.sentCount} emails were sent successfully.`
          : `Successfully sent to ${sendingStatus.sentCount} recipients. ${sendingStatus.failedCount} failed. Check the logs for details.`,
        variant: sendingStatus.failedCount === 0 ? "default" : "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAsDraft = () => {
    if (!formData.subject.trim() || !formData.content.trim() || !formData.campaignName.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide campaign name, subject, and content before saving as draft.",
        variant: "destructive",
      });
      return;
    }

    saveMailDraft({
      campaignName: formData.campaignName,
      subject: formData.subject,
      content: formData.content,
      isHTML,
    });

    toast({
      title: "Draft Saved Successfully",
      description: (
        <div className="flex flex-col gap-1">
          <p>Campaign: {formData.campaignName}</p>
          <p className="text-sm text-muted-foreground">
            View all drafts in the <a href="/drafts" className="underline">drafts page</a>
          </p>
        </div>
      ),
      duration: 5000,
    });

    // Optional: Clear form after saving
    if (!draftId) {
      setFormData({
        campaignName: '',
        subject: '',
        content: '',
      });
      setIsHTML(false);
      setAttachments([]);
    }
  };

  const sendingProgress = sendingStatus.inProgress ? 
    ((sendingStatus.sentCount + sendingStatus.failedCount) / sendingStatus.totalRecipients) * 100 : 0;

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              name="campaignName"
              placeholder="Q2 Newsletter"
              className="max-w-md"
              value={formData.campaignName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Your Quarterly Update"
              className="max-w-md"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="html-mode"
              checked={isHTML}
              onCheckedChange={setIsHTML}
            />
            <Label htmlFor="html-mode">Enable HTML Mode</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder={isHTML ? "<h1>Hello</h1>" : "Hello"}
              className="min-h-[200px] font-mono"
              value={formData.content}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Attachments (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileAttachment}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    multiple
                  />
                  <Button type="button" variant="outline" className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Add Attachments
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                  </p>
                )}
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((file) => (
                    <div
                      key={file.filename}
                      className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="text-sm">{file.filename}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.filename)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="schedule-mode"
                checked={enableSchedule}
                onCheckedChange={setEnableSchedule}
              />
              <Label htmlFor="schedule-mode">Schedule for Later</Label>
            </div>

            {enableSchedule && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <Label>Schedule Time</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-2">
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">:</span>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={period} onValueChange={(value: "AM" | "PM") => setPeriod(value)}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {scheduledTime && (
                  <p className="text-sm text-muted-foreground">
                    Scheduled for: {format(scheduledTime, "PPP 'at' h:mm a")}
                  </p>
                )}
              </div>
            )}
          </div>

          {sendingStatus.inProgress && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sending Progress</span>
                  <span>{Math.round(sendingProgress)}%</span>
                </div>
                <Progress value={sendingProgress} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Batch {sendingStatus.currentBatch} of {sendingStatus.totalBatches}</span>
                <span>{sendingStatus.sentCount} sent, {sendingStatus.failedCount} failed</span>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button 
              type="submit" 
              disabled={sendingStatus.inProgress}
              className="min-w-[140px]"
            >
              {sendingStatus.inProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : scheduledTime ? (
                'Schedule Campaign'
              ) : (
                'Send Now'
              )} </Button>
            <Button 
              type="button" 
              variant="outline"
              disabled={sendingStatus.inProgress}
              onClick={handleSaveAsDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Email Logs</h3>
          {emailLogs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Email Logs</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all email logs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearLogs}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.campaignName || '-'}</TableCell>
                  <TableCell>{log.to}</TableCell>
                  <TableCell>{log.subject}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">Failed</span>
                          {log.error && (
                            <span className="text-sm text-muted-foreground">
                              ({log.error})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {emailLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No email logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}