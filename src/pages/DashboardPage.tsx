import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Users, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  XCircle,
  QrCode,
  BookOpen,
  FileText
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, getDocs, limit, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    let q;
    let unsubHistory: (() => void) | undefined;
    let unsubAttendance: (() => void) | undefined;

    if (profile.role === 'instructor') {
      q = query(
        collection(db, 'lectures'),
        where('instructorId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );

      // Fetch all attendance records for this instructor's lectures
      const attendanceQ = query(
        collectionGroup(db, 'attendance'),
        where('instructorId', '==', profile.uid)
      );
      unsubAttendance = onSnapshot(attendanceQ, (snapshot) => {
        setAttendanceRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else {
      q = query(
        collection(db, 'lectures'),
        orderBy('createdAt', 'desc')
      );

      // Fetch history/attendance for students
      const historyQ = query(
        collectionGroup(db, 'attendance'),
        where('studentId', '==', profile.uid),
        orderBy('timestamp', 'desc')
      );
      unsubHistory = onSnapshot(historyQ, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAttendanceRecords(records);
        setStudentHistory(records.slice(0, 5));
      });
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(docs);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubHistory) unsubHistory();
      if (unsubAttendance) unsubAttendance();
    };
  }, [profile]);

  if (profile?.role === 'instructor') {
    return <InstructorDashboard lectures={lectures} attendance={attendanceRecords} loading={loading} />;
  }
  
  return <StudentDashboard lectures={lectures} attendance={attendanceRecords} history={studentHistory} loading={loading} />;
}

function InstructorDashboard({ lectures, attendance, loading }: { lectures: any[], attendance: any[], loading: boolean }) {
  const { t, i18n } = useTranslation();
  const { profile: userProfile } = useAuth();

  const presentCount = attendance.filter(r => r.status === 'present').length;
  const lateCount = attendance.filter(r => r.status === 'late').length;
  const totalAttendance = attendance.length;
  
  // Real stats calculation
  const stats = [
    { label: 'dashboard.stats.totalLectures', value: lectures.length, icon: Calendar, color: 'emerald' },
    { label: 'dashboard.stats.present', value: presentCount, icon: Users, color: 'blue' },
    { label: 'dashboard.stats.late', value: lateCount, icon: Clock, color: 'amber' },
    { 
      label: 'dashboard.stats.rate', 
      value: attendance.length > 0 ? `${Math.round((presentCount / attendance.length) * 100)}%` : '0%', 
      icon: ArrowUpRight, 
      color: 'purple'
    },
  ];

  // Dynamic Pie Data
  const total = attendance.length || 1; // avoid div by 0
  const pieData = attendance.length > 0 ? [
    { name: 'On Time', value: Math.round((presentCount / total) * 100), fill: '#22c55e' },
    { name: 'Late', value: Math.round((lateCount / total) * 100), fill: '#f59e0b' },
    { name: 'Absent', value: 0, fill: '#ef4444' }, // We don't have expected student list yet
  ] : [
    { name: 'On Time', value: 0, fill: '#22c55e' },
    { name: 'Late', value: 0, fill: '#f59e0b' },
    { name: 'Absent', value: 0, fill: '#ef4444' },
  ];

  // Group attendance by day of week for the chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const chartData = weekDays.map(day => {
    // This is a simplification. Real data would filter by actual date.
    return { name: day, present: 0, absent: 0 };
  });

  // Simple calculation for the dash in the center of pie chart
  const avgRate = attendance.length > 0 ? `${Math.round((presentCount / total) * 100)}%` : '0%';

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.welcome', { name: userProfile?.name })}</h1>
          <p className="text-text-dim text-sm">Here's a summary of your performance and engagement.</p>
        </div>
        <div className="flex gap-2">
            <Link 
              to="/reports" 
              className="btn-immersive-secondary flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              View Reports
            </Link>
            <Link 
              to="/lectures/create" 
              className="btn-immersive flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {t('dashboard.instructor.createLecture')}
            </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             key={stat.label}
             className="immersive-card group hover:border-primary/30 transition-all cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                  <stat.icon size={20} />
               </div>
            </div>
            <div>
              <p className="stat-label-immersive">{t(stat.label)}</p>
              <p className="stat-value-immersive">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Trend */}
        <div className="immersive-card lg:col-span-2">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Attendance Trend</h3>
              <div className="flex gap-4 text-[10px] items-center">
                 <div className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Present</div>
                 <div className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-400" /> Absent</div>
              </div>
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Status Distribution */}
        <div className="immersive-card">
           <h3 className="text-sm font-bold mb-8 text-white uppercase tracking-widest">Status Distribution</h3>
           <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{avgRate}</span>
                <span className="text-[10px] text-text-dim uppercase font-bold">Average</span>
             </div>
           </div>
           <div className="mt-6 space-y-3">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                      <span className="text-xs text-text-dim font-medium">{item.name}</span>
                   </div>
                   <span className="text-xs text-white font-bold">{item.value}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard({ lectures, attendance, history, loading }: { lectures: any[], attendance: any[], history: any[], loading: boolean }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();

  const presentCount = attendance.filter(r => r.status === 'present').length;
  const lateCount = attendance.filter(r => r.status === 'late').length;
  const totalAttendance = attendance.length;

  const stats = [
    { label: 'dashboard.stats.totalLectures', value: totalAttendance, icon: BookOpen, color: 'blue' },
    { label: 'dashboard.stats.present', value: presentCount, icon: CheckCircle2, color: 'emerald' },
    { label: 'dashboard.stats.late', value: lateCount, icon: Clock, color: 'amber' },
    { label: 'dashboard.stats.rate', value: `${totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0}%`, icon: ArrowUpRight, color: 'purple' },
  ];

  const trendData = [
    { name: 'Week 1', rate: 100 },
    { name: 'Week 2', rate: 80 },
    { name: 'Week 3', rate: 90 },
    { name: 'Week 4', rate: 85 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.welcome', { name: profile?.name })}</h1>
          <p className="text-text-dim text-sm">Your learning journey and attendance overview.</p>
        </div>
         <Link 
          to="/checkin" 
          className="btn-immersive flex items-center justify-center gap-2"
        >
          <QrCode size={18} />
          {t('dashboard.student.checkIn')}
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             key={stat.label}
             className="immersive-card flex flex-col justify-between"
          >
            <div className={`mb-4 w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
               <stat.icon size={20} className={`text-${stat.color}-400`} />
            </div>
            <div>
              <p className="stat-label-immersive">{t(stat.label)}</p>
              <p className="stat-value-immersive">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="immersive-card">
           <h3 className="text-sm font-bold mb-8 text-white uppercase tracking-widest">Attendance Performance</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="immersive-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('dashboard.student.history')}</h3>
            {history.length > 0 && (
              <Link to="/attendance-history" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                View All
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((record, index) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      record.status === 'present' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                      {record.status === 'present' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[120px] md:max-w-none">{record.lectureName || record.lectureId}</p>
                      <p className="text-[10px] text-text-dim">{formatDate(record.timestamp)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    record.status === 'present' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    {t(`common.${record.status}`)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                 <div className="text-center">
                   <FileText size={40} className="mx-auto mb-3 text-text-dim opacity-20" />
                   <p className="text-text-dim text-sm">{t('dashboard.student.noHistory')}</p>
                   <p className="text-[10px] text-text-dim/50 mt-1 uppercase font-bold tracking-widest">Connect to a live session to see history</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
