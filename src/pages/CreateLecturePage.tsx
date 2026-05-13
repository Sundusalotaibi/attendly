import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Clock, ArrowLeft, Ruler, Save, BookOpen, Target, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export default function CreateLecturePage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    latitude: 0,
    longitude: 0,
    radius: 100,
    duration: 60
  });

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      }, (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get location. Please enable GPS.");
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      const startTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + formData.duration * 60000).toISOString();
      const lectureCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const lectureData = {
        name: formData.name,
        venue: formData.venue,
        lectureCode, // Short code for manual entry
        instructorId: profile.uid,
        instructorName: profile.name,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        radius: Number(formData.radius),
        startTime,
        endTime,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'lectures'), lectureData);
      navigate(`/lectures/${docRef.id}/qr`);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'lectures');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-text-dim hover:text-white transition-colors mb-6 font-medium"
      >
        <ArrowLeft size={20} className={i18n.language === 'ar' ? "rotate-180" : ""} />
        {t('common.back')}
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="immersive-card relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary-dark" />
        
        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">{t('lecture.create')}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Section */}
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1">{t('lecture.name')}</label>
              <div className="input-wrapper-immersive">
                <BookOpen className="input-icon-immersive" size={20} />
                <input 
                  required
                  type="text" 
                  className="input-field-immersive"
                  placeholder="e.g. Advanced Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1">{t('lecture.venue') || 'Venue / Hall'}</label>
              <div className="input-wrapper-immersive">
                <MapPin className="input-icon-immersive" size={20} />
                <input 
                  required
                  type="text" 
                  className="input-field-immersive"
                  placeholder="e.g. Hall 4B, Science Center"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1">{t('lecture.date')}</label>
                <div className="input-wrapper-immersive">
                  <Calendar className="input-icon-immersive" size={20} />
                  <input 
                    required
                    type="date" 
                    className="input-field-immersive min-h-[50px] w-full"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1">{t('common.time')}</label>
                <div className="input-wrapper-immersive">
                  <Clock className="input-icon-immersive" size={20} />
                  <input 
                    required
                    type="time" 
                    className="input-field-immersive min-h-[50px] w-full"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest">
                  <MapPin size={18} className="text-primary" />
                  {t('lecture.location')}
                </div>
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-xl hover:bg-primary/30 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  <MapPin size={14} />
                  {t('lecture.getTime')}
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest ps-1">Latitude</p>
                   <div className="input-wrapper-immersive">
                     <Target className="input-icon-immersive" size={20} />
                     <input 
                      required
                      type="number"
                      step="any"
                      className="input-field-immersive font-mono"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})}
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest ps-1">Longitude</p>
                   <div className="input-wrapper-immersive">
                     <Compass className="input-icon-immersive" size={20} />
                     <input 
                      required
                      type="number"
                      step="any"
                      className="input-field-immersive font-mono"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})}
                     />
                   </div>
                </div>
             </div>
          </div>

          {/* Config Section */}
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1 truncate block">{t('lecture.radius')} (m)</label>
                <div className="input-wrapper-immersive">
                  <Ruler className="input-icon-immersive" size={20} />
                  <input 
                    required
                    type="number" 
                    min="10"
                    max="1000"
                    className="input-field-immersive w-full"
                    value={formData.radius}
                    onChange={(e) => setFormData({...formData, radius: Number(e.target.value)})}
                  />
                </div>
              </div>
               <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1 truncate block">{t('lecture.duration')} (min)</label>
                <div className="input-wrapper-immersive">
                  <Clock className="input-icon-immersive" size={20} />
                  <input 
                    required
                    type="number" 
                    min="1"
                    max="1440"
                    className="input-field-immersive w-full"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 btn-immersive flex items-center justify-center gap-3 text-lg mt-4"
          >
            {loading ? t('common.loading') : (
              <>
                <Save size={24} />
                <span className="font-bold">{t('common.save')}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
