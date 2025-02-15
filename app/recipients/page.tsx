"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, Search, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { EmailRecipient, saveMailList, getMailList } from "@/lib/storage";
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

export default function RecipientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [emailList, setEmailList] = useState<EmailRecipient[]>([]);

  useEffect(() => {
    const savedList = getMailList();
    setEmailList(savedList);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim()); // Remove empty rows
        
        let skippedRows = 0;
        const newEmails: EmailRecipient[] = [];
        const existingEmails = new Set(emailList.map(item => item.email.toLowerCase()));

        // Process each row starting from index 1 (skip header)
        rows.slice(1).forEach((row, index) => {
          const [email = '', name = ''] = row.split(',').map(item => item.trim());
          
          // Skip row if email is empty or invalid
          if (!email || !validateEmail(email)) {
            skippedRows++;
            return;
          }

          // Skip duplicate emails
          if (existingEmails.has(email.toLowerCase())) {
            skippedRows++;
            return;
          }

          newEmails.push({
            id: (emailList.length + newEmails.length + 1).toString(),
            email,
            name: name || undefined, // Only include name if it's not empty
            addedAt: new Date().toISOString().split('T')[0]
          });

          existingEmails.add(email.toLowerCase());
        });

        if (newEmails.length > 0) {
          const updatedList = [...emailList, ...newEmails];
          setEmailList(updatedList);
          saveMailList(updatedList);
          
          toast({
            title: "Recipients Imported",
            description: `Successfully imported ${newEmails.length} recipients.${
              skippedRows > 0 ? ` Skipped ${skippedRows} invalid or duplicate entries.` : ''
            }`,
          });
        } else {
          toast({
            title: "Import Failed",
            description: "No valid recipients found in the CSV file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    if (emailList.length === 0) {
      toast({
        title: "Export Failed",
        description: "No recipients to export.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Email', 'Name', 'Added Date'].join(','),
      ...emailList.map(record => [
        record.email,
        record.name || '',
        record.addedAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-list.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${emailList.length} recipients to CSV.`,
    });
  };

  const handleRemove = (id: string) => {
    const updatedList = emailList.filter(record => record.id !== id);
    setEmailList(updatedList);
    saveMailList(updatedList);
    
    toast({
      title: "Recipient Removed",
      description: "The recipient has been removed from the mailing list.",
    });
  };

  const handleDeleteAll = () => {
    setEmailList([]);
    saveMailList([]);
    
    toast({
      title: "Mailing List Cleared",
      description: "All recipients have been removed from the mailing list.",
    });
  };

  const filteredEmails = emailList.filter(record =>
    record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold text-primary">Mailing List Management</h1>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                {emailList.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Recipients</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all {emailList.length} recipients
                          from your mailing list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAll}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.email}</TableCell>
                      <TableCell>{record.name || '-'}</TableCell>
                      <TableCell>{record.addedAt}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(record.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmails.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No email addresses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <p>Total Recipients: {emailList.length}</p>
              {searchTerm && (
                <p>Showing {filteredEmails.length} of {emailList.length} recipients</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}