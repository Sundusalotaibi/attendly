import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  QrCode, 
  ChevronRight, 
  Plus, 
  BookOpen, 
  Trash2, 
  Users,
  Calendar,
  Clock,
  MapPin,
  Ruler
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, cn } from '../lib/utils';

export default function LecturesListPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile || profile.role !== 'instructor') return;

    const q = query(
      collection(db, 'lectures'),
      where('instructorId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common.confirmDelete') || 'Are you sure you want to delete this lecture?')) {
      try {
        await deleteDoc(doc(db, 'lectures', id));
      } catch (error) {
        console.error("Error deleting lecture:", error);
      }
    }
  };

  const filteredLectures = lectures.filter(lec => 
    lec.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('lecture.list') || 'Manage Lectures'}</h1>
          <p className="text-text-dim text-sm">{t('lecture.listSubtitle') || 'Create, manage and monitor your active sessions.'}</p>
        </div>
        <Link 
          to="/lectures/create" 
          className="btn-immersive flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          {t('dashboard.instructor.createLecture')}
        </Link>
      </header>

      {/* Search and Filters */}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLectures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredLectures.map((lec, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                key={lec.id}
                className="immersive-card flex flex-col group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary w-fit">
                      <BookOpen size={20} />
                    </div>
                    {lec.lectureCode && (
                      <span className="text-[10px] font-mono font-bold text-primary/80 uppercase tracking-widest mt-1">ID: {lec.lectureCode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/reports?lectureId=${lec.id}`}
                      className="p-2 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="View Attendance"
                    >
                      <Users size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(lec.id)}
                      className="p-2 text-text-dim hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Lecture"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-4 group-hover:text-primary transition-colors">{lec.name}</h3>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-text-dim text-xs">
                    <Calendar size={14} className="text-primary/60" />
                    {formatDate(lec.startTime, i18n.language)}
                  </div>
                  <div className="flex items-center gap-3 text-text-dim text-xs">
                    <Clock size={14} className="text-primary/60" />
                    {new Date(lec.startTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-3 text-text-dim text-xs">
                    <MapPin size={14} className="text-primary/60" />
                    <span>{lec.venue || 'No Venue Specified'} ({lec.radius}m)</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                   <Link 
                    to={`/lectures/${lec.id}/qr`}
                    className="w-full btn-immersive-secondary flex items-center justify-center gap-2 py-3 text-sm"
                   >
                     <QrCode size={16} />
                     Generate QR Code
                     <ChevronRight size={14} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
                   </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="immersive-card py-20 text-center">
          <BookOpen size={60} className="mx-auto mb-4 text-text-dim opacity-10" />
          <h3 className="text-xl font-bold text-white mb-2">No lectures found</h3>
          <p className="text-text-dim text-sm max-w-sm mx-auto">
            {searchTerm ? "Try adjusting your search term." : "You haven't created any lectures yet. Start by creating your first session."}
          </p>
          {!searchTerm && (
            <Link to="/lectures/create" className="btn-immersive inline-flex mt-6 gap-2">
              <Plus size={18} />
              Create your first lecture
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
