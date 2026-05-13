import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { calculateDistance, cn } from '../lib/utils';
import { 
  MapPin, 
  ShieldCheck, 
  XOctagon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  ArrowRight,
  Maximize,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function CheckInPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'permission_denied'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lectureIdInput, setLectureIdInput] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [checkInMode, setCheckInMode] = useState<'qr' | 'manual'>('qr');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById("qr-reader");
      if (!element || !isMounted) return;

      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 20, // Better balance between performance and battery
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        const onScanSuccess = (decodedText: string) => {
          if (isMounted && html5QrCode?.isScanning) {
            html5QrCode.stop().then(() => {
              handleCheckIn(decodedText);
            }).catch(err => console.error("Error stopping scanner after success", err));
          }
        };

        try {
          // 1. Try environment facing mode (standard)
          await html5QrCode.start(
            { facingMode: { exact: "environment" } }, 
            config,
            onScanSuccess,
            () => {}
          );
        } catch (err) {
          console.warn("Exact environment facing mode failed, searching for cameras...", err);
          // 2. Search for back/rear labels if exact failed
          const devices = await Html5Qrcode.getCameras();
          if (isMounted && devices && devices.length > 0) {
            const backCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            ) || devices[devices.length - 1];

            await html5QrCode.start(
              backCamera.id,
              config,
              onScanSuccess,
              () => {}
            );
          } else if (isMounted) {
            // 3. Last ditch effort with generic environment
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              onScanSuccess,
              () => {}
            );
          }
        }
      } catch (err: any) {
        console.error("Camera start error:", err);
        if (isMounted) {
          if (err === "NotAllowedError" || (typeof err === 'string' && err.includes("permission")) || err?.name === "NotAllowedError") {
            setStatus('permission_denied');
          } else {
            if (checkInMode === 'qr') {
              setStatus('error');
              setErrorMsg("Failed to start camera. Please ensure permissions are granted.");
            }
          }
        }
      }
    };

    if (checkInMode === 'qr' && status === 'idle') {
      startScanner();
    }

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.warn("Cleanup stop error", e));
      }
    };
  }, [checkInMode, status]);

  const handleCheckIn = async (lectureId: string) => {
    if (!profile) return;
    setLoading(true);
    setStatus('verifying');
    setErrorMsg('');

    try {
      
      let lecture: any = null;
      let finalLectureId = lectureId;

      // Try fetching by Document ID first
      const lecRef = doc(db, 'lectures', lectureId);
      const lecSnap = await getDoc(lecRef);

      if (lecSnap.exists()) {
        lecture = lecSnap.data();
      } else {
        // Try searching by lectureCode (for manual entry or short-code QR)
        const q = query(collection(db, 'lectures'), where('lectureCode', '==', lectureId.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          lecture = doc.data();
          finalLectureId = doc.id;
        }
      }

      if (!lecture) {
        throw new Error("Lecture not found. Please check the ID.");
      }

      const now = new Date();
      const endTime = new Date(lecture.endTime);

      if (now > endTime) {
        setStatus('error');
        setErrorMsg(t('checkin.errorTime'));
        setLoading(false);
        return;
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lectureLat = Number(lecture.latitude);
      const lectureLng = Number(lecture.longitude);
      const lectureRadius = Number(lecture.radius || 100);

      const dist = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        lectureLat,
        lectureLng
      );
      setDistance(Math.round(dist));

      if (dist > (lectureRadius + 10)) {
        setStatus('error');
        setErrorMsg(t('checkin.errorLocation'));
        setLoading(false);
        return;
      }

      const attPath = `lectures/${finalLectureId}/attendance/${profile.uid}`;
      const attRef = doc(db, attPath);
      const attSnap = await getDoc(attRef);
      if (attSnap.exists()) {
        setStatus('error');
        setErrorMsg(t('checkin.errorDuplicate'));
        setLoading(false);
        return;
      }

      const isLate = now > new Date(new Date(lecture.startTime).getTime() + 5 * 60000); // Late if > 5m after start
      const attendanceStatus = isLate ? 'late' : 'present';

      await setDoc(attRef, {
        lectureId: finalLectureId,
        lectureName: lecture.name,
        instructorId: lecture.instructorId,
        studentId: profile.uid,
        studentName: profile.name,
        timestamp: now.toISOString(),
        status: attendanceStatus,
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        totalLectures: increment(1),
        [attendanceStatus === 'late' ? 'lateCount' : 'presentCount']: increment(1)
      });

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || t('checkin.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-white mb-2">{t('checkin.title')}</h1>
        <p className="text-text-dim text-sm">{t('login.subtitle')}</p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="immersive-card flex flex-col items-center gap-6 py-10"
          >
             {/* Toggle Section */}
             <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 relative z-10 shadow-inner">
                <button 
                  onClick={() => setCheckInMode('qr')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    checkInMode === 'qr' 
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                    : "text-text-dim hover:text-white"
                  )}
                >
                  <Maximize size={14} />
                  Scan QR
                </button>
                <button 
                  onClick={() => setCheckInMode('manual')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    checkInMode === 'manual' 
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                    : "text-text-dim hover:text-white"
                  )}
                >
                  <Keyboard size={14} />
                  Enter ID
                </button>
             </div>

             <div className="w-full">
                <AnimatePresence mode="wait">
                  {checkInMode === 'qr' ? (
                    <motion.div
                      key="qr-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border border-white/10 bg-bg-deep/50 relative group">
                        <div id="qr-reader" className="w-full" />
                        {!loading && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                            <div className="w-16 h-16 rounded-2xl border-2 border-primary/50 flex items-center justify-center text-primary bg-primary/10">
                              <QrCode size={32} />
                            </div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Position QR in Frame</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 px-4"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-dim uppercase tracking-widest ps-1">{t('lecture.id') || 'Lecture ID'}</label>
                        <div className="flex gap-2">
                          <div className="input-wrapper-immersive flex-1">
                            <Keyboard className="input-icon-immersive" size={18} />
                            <input 
                              type="text" 
                              placeholder="Enter Lecture ID" 
                              className="input-field-immersive font-mono"
                              value={lectureIdInput}
                              onChange={(e) => setLectureIdInput(e.target.value)}
                            />
                          </div>
                          <button 
                            disabled={!lectureIdInput}
                            onClick={() => handleCheckIn(lectureIdInput)}
                            className="px-6 btn-immersive rounded-xl disabled:opacity-30 flex items-center justify-center transition-transform active:scale-95"
                          >
                            <ArrowRight size={24} className={i18n.language === 'ar' ? "rotate-180" : ""} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex items-center justify-center gap-2 text-primary/80">
                <MapPin size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">GPS verification active</span>
             </div>
          </motion.div>
        ) : status === 'verifying' ? (
          <motion.div 
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 py-20"
          >
             <div className="relative">
                <Loader2 className="animate-spin text-primary" size={64} />
                <MapPin className="absolute inset-0 m-auto text-primary-dark" size={24} />
             </div>
             <p className="text-xl font-bold text-white animate-pulse">{t('checkin.verifying')}</p>
          </motion.div>
        ) : status === 'success' ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="immersive-card flex flex-col items-center text-center gap-6 p-10"
          >
             <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <CheckCircle2 size={40} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white">{t('checkin.success')}</h2>
               {distance !== null && (
                 <p className="text-primary mt-2 font-medium">{t('checkin.distanceMsg', { distance })}</p>
               )}
             </div>
             <button 
               onClick={() => setStatus('idle')}
               className="w-full btn-immersive"
             >
                {t('common.back')}
             </button>
          </motion.div>
        ) : status === 'permission_denied' ? (
          <motion.div 
            key="permission-denied"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="immersive-card flex flex-col items-center text-center gap-6 p-10 border-amber-500/30"
          >
             <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <AlertCircle size={40} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white">Camera Access Denied</h2>
               <p className="text-amber-400 mt-2 font-medium text-sm">Please enable camera access in your browser settings to use QR scanning.</p>
             </div>
             <div className="flex flex-col w-full gap-3">
               <button 
                 onClick={() => {
                   setStatus('idle');
                   setCheckInMode('qr');
                 }}
                 className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/10"
               >
                  Try Enabling Again
               </button>
               <button 
                 onClick={() => {
                   setStatus('idle');
                   setCheckInMode('manual');
                 }}
                 className="w-full py-3 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-colors"
               >
                  Use Manual Entry
               </button>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="immersive-card flex flex-col items-center text-center gap-6 p-10 border-red-500/30"
          >
             <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <AlertCircle size={40} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white">{errorMsg}</h2>
               {distance !== null && (
                 <p className="text-red-400 mt-2 font-medium">{t('checkin.distanceMsg', { distance })}</p>
               )}
             </div>
             <button 
               onClick={() => setStatus('idle')}
               className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/10"
             >
                Try Again
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
