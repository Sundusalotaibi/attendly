import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MoreVertical,
  MapPin
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();
  const [lectures, setLectures] = useState<any[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<string>(location.state?.lectureId || '');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'lectures'),
      where('instructorId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (sn) => {
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setLectures(data);
      if (!selectedLecture && data.length > 0) {
        setSelectedLecture(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (!selectedLecture) {
      setAttendance([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, `lectures/${selectedLecture}/attendance`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (sn) => {
       setAttendance(sn.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedLecture]);

  const filteredAttendance = attendance.filter(att => 
    att.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight">{t('nav.reports')}</h1>
           <p className="text-text-dim text-sm">{t('reports.subtitle')}</p>
        </div>
        <button className="btn-immersive flex items-center justify-center gap-2">
           <Download size={18} />
           {t('reports.exportCSV')}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Filter Sidebar */}
         <div className="flex flex-col gap-6">
            <h3 className="stat-label-immersive">{t('nav.lectures')}</h3>
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pe-2 custom-scrollbar">
              {lectures.map((lec) => (
                <button
                  key={lec.id}
                  onClick={() => setSelectedLecture(lec.id)}
                  className={cn(
                    "w-full text-start p-4 rounded-xl border transition-all duration-200",
                    selectedLecture === lec.id 
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-white/5 border-white/5 text-text-dim hover:bg-white/10"
                  )}
                >
                  <p className="font-bold text-sm">{lec.name}</p>
                  <div className="flex items-center gap-2 mt-1 opacity-60">
                    <MapPin size={10} />
                    <p className="text-[10px]">{lec.venue || 'No Venue'}</p>
                  </div>
                  <p className="text-[10px] opacity-60 mt-1">{formatDate(lec.startTime, i18n.language)}</p>
                </button>
              ))}
            </div>
         </div>

         {/* Results Table */}
         <div className="lg:col-span-3">
            <div className="immersive-card overflow-hidden">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    <span className="font-bold text-white text-sm">{attendance.length} {t('reports.present')}</span>
                  </div>
                  <div className="input-wrapper-immersive max-w-xs">
                    <Search className="input-icon-immersive" size={16} />
                    <input 
                      type="text" 
                      placeholder={t('reports.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field-immersive"
                    />
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                     <thead>
                        <tr className="border-b border-white/5">
                           <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">{t('reports.studentName')}</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">{t('reports.checkInTime')}</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">{t('reports.status')}</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {filteredAttendance.length > 0 ? filteredAttendance.map((att) => (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={att.id} 
                            className="hover:bg-white/5 transition-colors group"
                          >
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-text-dim text-[10px] group-hover:text-primary transition-colors">
                                      {att.studentName.charAt(0)}
                                   </div>
                                   <span className="font-bold text-white text-sm">{att.studentName}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-text-dim text-sm">{formatDate(att.timestamp)}</td>
                             <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                                   <CheckCircle2 size={12} />
                                   {t('reports.present')}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-end">
                                <button className="p-2 text-text-dim hover:text-white transition-colors">
                                   <MoreVertical size={16} />
                                </button>
                             </td>
                          </motion.tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-text-dim">
                               <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-10" />
                               <p className="text-sm">{selectedLecture ? t('reports.noAttendance') : t('reports.selectLecture')}</p>
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
