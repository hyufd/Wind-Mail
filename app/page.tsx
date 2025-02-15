"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Mail, Send, Settings, FileSpreadsheet, AlertCircle, Users, FileText } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { getMailDrafts, getMailList, getEmailLogs } from '@/lib/storage';

// Dynamically import ComposePage with loading fallback
const ComposePage = dynamic(() => import('./compose/page'), {
  loading: () => (
    <Card className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-40 bg-muted rounded"></div>
      </div>
    </Card>
  ),
  ssr: false
});

const CustomizedAxisTick = ({ x = 0, y = 0, payload = { value: '' } }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={12}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{`Time: ${label}`}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
          {`${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

function processEmailLogs() {
  const logs = getEmailLogs();
  const timeSlots: { [key: string]: { success: number; failed: number } } = {};
  
  // Get the last 24 hours
  const now = new Date();
  const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  // Initialize all hours with zero counts
  for (let i = 0; i < 24; i++) {
    const hour = new Date(last24Hours.getTime() + (i * 60 * 60 * 1000));
    const timeKey = hour.getHours().toString().padStart(2, '0') + ':00';
    timeSlots[timeKey] = { success: 0, failed: 0 };
  }

  // Group logs by hour for the last 24 hours
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    if (date >= last24Hours) {
      const hour = date.getHours().toString().padStart(2, '0') + ':00';
      if (log.status === 'success') {
        timeSlots[hour].success++;
      } else {
        timeSlots[hour].failed++;
      }
    }
  });

  // Convert to array and sort by time
  return Object.entries(timeSlots)
    .map(([time, counts]) => ({
      time,
      success: counts.success,
      failed: counts.failed
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');
  const [drafts, setDrafts] = useState<ReturnType<typeof getMailDrafts>>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [successfulSends, setSuccessfulSends] = useState(0);
  const [failedSends, setFailedSends] = useState(0);
  const [chartData, setChartData] = useState(processEmailLogs());

  useEffect(() => {
    // Load drafts and statistics
    setDrafts(getMailDrafts());
    
    // Get total emails from mail list
    const mailList = getMailList();
    setTotalEmails(mailList.length);

    // Get successful and failed sends from email logs
    const emailLogs = getEmailLogs();
    const successful = emailLogs.filter(log => log.status === 'success').length;
    const failed = emailLogs.filter(log => log.status === 'failed').length;
    setSuccessfulSends(successful);
    setFailedSends(failed);

    // Update chart data
    setChartData(processEmailLogs());

    if (draftId) {
      const draft = getMailDrafts().find(d => d.id === draftId);
      if (draft) {
        window.localStorage.setItem('currentDraft', JSON.stringify(draft));
      }
    }

    // Cleanup
    return () => {
      window.localStorage.removeItem('currentDraft');
    };
  }, [draftId]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-primary">Wind Mail</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/drafts')}
              className="inline-flex items-center"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Mail Drafts
            </Button>
            <Button
              onClick={() => router.push('/recipients')}
              className="inline-flex items-center"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Mail List
            </Button>
            <Button
              onClick={() => router.push('/settings')}
              className="inline-flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
                <h3 className="text-2xl font-bold">{totalEmails}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Send className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful Sends</p>
                <h3 className="text-2xl font-bold">{successfulSends}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed Sends</p>
                <h3 className="text-2xl font-bold">{failedSends}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <FileSpreadsheet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mail Drafts</p>
                <h3 className="text-2xl font-bold">{drafts.length}</h3>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Sending Activity (Last 24 Hours)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time"
                  tick={<CustomizedAxisTick />}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  scale="point"
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tick={<CustomizedAxisTick />}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="success"
                  name="Successful"
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 76% 36%)', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(142 76% 36%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed"
                  name="Failed"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="mt-6">
          <ComposePage />
        </div>
      </div>
    </div>
  );
}