"use client";

import { useAuditLogs } from '@/hooks/domains/useReportsQueries';
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, User, Activity, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { AuditLog, User as PrismaUser } from "@prisma/client";
import { AnimatedPage } from "@/components/animated-page";
import { RoleGuard } from "@/components/RoleGuard";

export default function AuditLogsPage() {
  const { data: logsData = [], isLoading: loading } = useAuditLogs(100, 0);
  const logs = logsData;

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (action.includes("APPROVE")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (action.includes("REJECT") || action.includes("DELETE")) return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    if (action.includes("UPDATE") || action.includes("RECEIVE")) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };



  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']} fallback={<div className="p-8 text-slate-500">Access denied. Super Admin only.</div>}>
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="System Audit Trail"
        icon={ShieldAlert}
        description="Comprehensive log of critical system actions and data modifications"
      />
      <DataTable 
        columns={[
          {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (val: string) => <span className="font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(val).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          },
          {
            title: "User",
            key: "user",
            render: (_, log: AuditLog & { user: PrismaUser }) => (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{log.user?.name || log.user?.email}</span>
                <span className="text-xs text-slate-400">({log.user?.role})</span>
              </div>
            )
          },
          {
            title: "Action",
            key: "action",
            render: (_, log: AuditLog & { user: PrismaUser }) => (
              <Badge variant="secondary" className={getActionColor(log.action)}>
                {log.action}
              </Badge>
            )
          },
          {
            title: "Target Module",
            key: "target",
            render: (_, log: AuditLog & { user: PrismaUser }) => (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>{log.targetType}</span>
                {log.targetId && <span className="text-slate-400">#{log.targetId}</span>}
              </div>
            )
          },
          {
            title: "Details",
            key: "details",
            render: (_, log: AuditLog & { user: PrismaUser }) => (
              <div className="flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md truncate">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{log.details || "-"}</span>
              </div>
            )
          }
        ]}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
    </AnimatedPage>
    </RoleGuard>
  );
}
