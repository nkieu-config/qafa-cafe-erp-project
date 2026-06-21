"use client"

import { useAuth } from "@/context/AuthContext"
import { useAttendance, useShifts } from "@/hooks/useQueries"
import { Table, Tag, Typography, Tooltip } from "antd"
import { Clock, AlertCircle } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { format, isSameDay, differenceInMinutes } from "date-fns"

const { Text } = Typography;

export default function AttendancePage() {
  const { activeBranchId } = useAuth()
  const { data: attendanceData, isLoading: loadingAtt } = useAttendance()
  const { data: shiftsData, isLoading: loadingShifts } = useShifts(activeBranchId ? 'EMPLOYEE' : undefined, activeBranchId ?? undefined)

  const attendance = attendanceData || []
  const shifts = shiftsData || []
  const isLoading = loadingAtt || loadingShifts

  const columns = [
    {
      title: 'Date',
      dataIndex: 'clockIn',
      key: 'date',
      render: (val: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{format(new Date(val), 'dd MMM yyyy')}</span>,
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'in',
      render: (val: string, record: any) => {
        const clockInDate = new Date(val);
        const dayShift = shifts.find((s: any) => isSameDay(new Date(s.startTime), clockInDate));
        
        let isLate = false;
        let lateMinutes = 0;
        
        if (dayShift) {
          const shiftStart = new Date(dayShift.startTime);
          lateMinutes = differenceInMinutes(clockInDate, shiftStart);
          if (lateMinutes > 15) {
            isLate = true;
          }
        }

        return (
          <div className="flex items-center gap-2">
            <Text type={isLate ? "danger" : "success"} className="font-mono font-bold">
              {format(clockInDate, 'HH:mm:ss')}
            </Text>
            {isLate && (
              <Tooltip title={`Late by ${lateMinutes} minutes (Shift started at ${format(new Date(dayShift.startTime), 'HH:mm')})`}>
                <Tag color="error" className="flex items-center gap-1 font-bold rounded-md border-0 m-0 shadow-sm">
                  <AlertCircle className="w-3 h-3" /> LATE
                </Tag>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'out',
      render: (val: string) => val ? (
        <Text className="font-mono text-slate-600 dark:text-slate-400 font-medium">{format(new Date(val), 'HH:mm:ss')}</Text>
      ) : (
        <Tag color="processing" className="animate-pulse font-bold border-0 shadow-sm">Active</Tag>
      ),
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'hours',
      align: 'right' as const,
      render: (val: number) => val ? (
        <span className="font-bold">{val.toFixed(2)} hrs</span>
      ) : (
        <span className="text-slate-400">-</span>
      ),
    },
  ];

  return (
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="My Attendance Records"
        icon={Clock}
      />
      <DataTable 
        columns={columns} 
        dataSource={attendance} 
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        rowClassName={(record: any) => {
          const clockInDate = new Date(record.clockIn);
          const dayShift = shifts.find((s: any) => isSameDay(new Date(s.startTime), clockInDate));
          if (dayShift) {
            const lateMinutes = differenceInMinutes(clockInDate, new Date(dayShift.startTime));
            if (lateMinutes > 15) return "bg-rose-50/50 dark:bg-rose-900/10";
          }
          return "";
        }}
      />
    </AnimatedPage>
  )
}
