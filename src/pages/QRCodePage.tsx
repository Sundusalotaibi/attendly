import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Clock, MapPin, Users, Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

export default function QRCodePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'lectures', id), (doc) => {
      if (doc.exists()) {
        setLecture({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center">
       <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!lecture) return <div>Lecture not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
       <div className="flex items-center justify-between mb-8">
         <Link to="/lectures" className="flex items-center gap-2 text-text-dim hover:text-white font-medium transition-colors">
           <ArrowLeft size={18} className={i18n.language === 'ar' ? "rotate-180" : ""} />
           {t('common.back')}
         </Link>
         <Link 
          to="/reports" 
          state={{ lectureId: id }}
          className="flex items-center gap-2 text-primary font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
         >
           <Users size={16} />
           View Attendance
         </Link>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: i18n.language === 'ar' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
             <div className="immersive-card space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                      LIVE SESSION
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Lecture ID</span>
                    <span className="text-xl font-mono font-black text-primary tracking-wider">{lecture.lectureCode || '------'}</span>
                  </div>
                </div>
                <h1 className="text-4xl font-black text-white leading-tight">{lecture.name}</h1>
                
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex items-center gap-4 text-text-dim">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <CalendarIcon />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{t('common.date')}</p>
                        <p className="text-white font-medium">{formatDate(lecture.startTime, i18n.language)}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 text-text-dim">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <Clock className="text-text-dim" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{t('lecture.duration')}</p>
                        <p className="text-white font-medium">Until {formatDate(lecture.endTime, i18n.language)}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 text-text-dim">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <MapPin className="text-text-dim" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{t('lecture.venue')}</p>
                        <p className="text-white font-medium">{lecture.venue || 'No Venue Specified'}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 text-text-dim">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <MapPin className="text-text-dim" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{t('lecture.location')}</p>
                        <p className="text-white font-medium">{lecture.latitude.toFixed(4)}, {lecture.longitude.toFixed(4)} ({lecture.radius}m)</p>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: i18n.language === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center"
          >
             <div className="bg-black/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group backdrop-blur-xl">
                <div className="bg-white p-5 rounded-2xl shadow-xl relative z-10">
                   <div className="scan-line" />
                   <QRCodeSVG 
                      value={lecture.lectureCode || id} 
                      size={240}
                      level="H"
                      includeMargin={false}
                   />
                </div>

                <div className="mt-8 text-center relative z-10">
                   <p className="text-white font-bold text-lg mb-1">{t('lecture.qrCode')}</p>
                   <p className="text-text-dim text-xs">{t('lecture.scanInstructions')}</p>
                   <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                        <MapPin size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">GPS Protected</span>
                   </div>
                </div>
             </div>

             <div className="flex gap-4 mt-8 w-full px-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-all">
                   <Download size={16} />
                   Download
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-all">
                   <Share2 size={16} />
                   Share
                </button>
             </div>
          </motion.div>
       </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
