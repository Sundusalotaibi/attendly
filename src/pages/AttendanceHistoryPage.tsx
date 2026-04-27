import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Search,
  BookOpen
} from 'lucide-react';
import { collectionGroup, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { formatDate, cn } from '../lib/utils';

export default function AttendanceHistoryPage() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collectionGroup(db, 'attendance'),
      where('studentId', '==', profile.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredHistory = history.filter(h => 
    h.lectureName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.lectureId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.student.history')}</h1>
        <p className="text-text-dim text-sm mt-1">Review your full attendance records and performance.</p>
      </header>

      <div className="immersive-card py-4">
        <div className="input-wrapper-immersive">
          <Search size={18} className="input-icon-immersive" />
          <input 
            type="text" 
            placeholder={t('reports.searchPlaceholder') || "Search by lecture name..."}
            className="input-field-immersive"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.map((record, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={record.id}
                className="immersive-card flex items-center justify-between group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                     record.status === 'present' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                   )}>
                     {record.status === 'present' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                   </div>
                   <div>
                     <h3 className="font-bold text-white group-hover:text-primary transition-colors">
                       {record.lectureName || record.lectureId}
                     </h3>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-text-dim font-bold uppercase tracking-widest">
                          <Calendar size={10} />
                          {formatDate(record.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-dim font-bold uppercase tracking-widest">
                          <Clock size={10} />
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                     record.status === 'present' 
                       ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                       : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                   )}>
                     {t(`common.${record.status}`)}
                   </span>
                   {record.lectureCode && (
                     <span className="text-[10px] font-mono text-text-dim/50 font-bold uppercase">ID: {record.lectureCode}</span>
                   )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <FileText size={48} className="text-text-dim opacity-10 mb-4" />
            <p className="text-text-dim font-medium">{t('dashboard.student.noHistory')}</p>
            <p className="text-[10px] text-text-dim/50 mt-1 uppercase font-black tracking-[0.2em]">Start attending lectures to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}
