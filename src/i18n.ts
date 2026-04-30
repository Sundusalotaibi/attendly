import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      brand: "Attendly",
      login: {
        title: "Welcome Back",
        subtitle: "Sign in to manage attendance",
        googleSignIn: "Sign in with Google",
        asInstructor: "I am an Instructor",
        asStudent: "I am a Student",
        selectRole: "Select your role to continue",
        email: "Email Address",
        password: "Password",
        name: "Full Name",
        signIn: "Sign In",
        signUp: "Create Account",
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?",
        orContinue: "Or continue with"
      },
      dashboard: {
        welcome: "Welcome, {{name}}",
        stats: {
          totalLectures: "Total Lectures",
          present: "Present",
          absent: "Absent",
          late: "Late",
          rate: "Attendance Rate"
        },
        instructor: {
          createLecture: "Create New Lecture",
          recentLectures: "Recent Lectures",
          noLectures: "No lectures created yet."
        },
        student: {
          history: "Attendance History",
          noHistory: "No attendance records found.",
          checkIn: "New Check-in"
        }
      },
      lecture: {
        create: "Create Lecture",
        name: "Lecture Name",
        date: "Date",
        location: "Location",
        radius: "Allowed Radius (meters)",
        venue: "Venue / Hall",
        duration: "Attendance Window (minutes)",
        success: "Lecture created successfully",
        qrCode: "Lecture QR Code",
        scanInstructions: "Students must scan this code using the Attendly app while being within the allowed physical range.",
        getTime: "Get Current Location",
        list: "Manage Lectures",
        listSubtitle: "Create, manage and monitor your active sessions.",
        id: "Lecture ID"
      },
      checkin: {
        title: "Check-in",
        scan: "Scan QR Code",
        verifying: "Verifying location...",
        success: "Attendance recorded successfully!",
        errorLocation: "You are outside the allowed radius.",
        errorTime: "Check-in time has expired.",
        errorDuplicate: "You've already checked in for this lecture.",
        errorGeneric: "Failed to record attendance.",
        distanceMsg: "You are {{distance}}m away from the lecture location."
      },
      common: {
        back: "Back",
        save: "Save & Generate QR",
        cancel: "Cancel",
        loading: "Loading...",
        status: "Status",
        date: "Date",
        time: "Time",
        present: "Present",
        late: "Late",
        absent: "Absent",
        confirmDelete: "Are you sure you want to delete this lecture?"
      },
   nav: {
  dashboard: "Dashboard",
  lectures: "Lectures",
  reports: "Reports",
  settings: "Settings",
  history: "Attendance History",
  logout: "Logout"
},

reports: {
  subtitle: "View attendance reports"
},
  ar: {
    translation: {
      brand: "Attendly",
      login: {
        title: "مرحباً بعودتك",
        subtitle: "سجل الدخول لإدارة الحضور",
        googleSignIn: "تسجيل الدخول باستخدام Google",
        asInstructor: "أنا محاضر",
        asStudent: "أنا طالب",
        selectRole: "اختر دورك للمتابعة",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        name: "الاسم الكامل",
        signIn: "تسجيل الدخول",
        signUp: "إنشاء حساب",
        noAccount: "ليس لديك حساب؟",
        hasAccount: "لديك حساب بالفعل؟",
        orContinue: "أو المتابعة باستخدام"
      },
      dashboard: {
        welcome: "مرحباً، {{name}}",
        stats: {
          totalLectures: "إجمالي المحاضرات",
          present: "حاضر",
          absent: "غائب",
          late: "متأخر",
          rate: "نسبة الحضور"
        },
        instructor: {
          createLecture: "إنشاء محاضرة جديدة",
          recentLectures: "المحاضرات الأخيرة",
          noLectures: "لا توجد محاضرات منشأة بعد."
        },
        student: {
          history: "سجل الحضور",
          noHistory: "لا توجد سجلات حضور.",
          checkIn: "تسجيل حضور جديد"
        }
      },
      lecture: {
        create: "إنشاء محاضرة",
        name: "اسم المحاضرة",
        date: "التاريخ",
        location: "الموقع",
        radius: "القطر المسموح (أمتار)",
        venue: "القاعة / المكان",
        duration: "نافذة الحضور (دقائق)",
        success: "تم إنشاء المحاضرة بنجاح",
        qrCode: "رمز QR للمحاضرة",
        scanInstructions: "يجب على الطلاب مسح هذا الرمز باستخدام تطبيق Attendly أثناء وجودهم داخل النطاق الفعلي المسموح به.",
        getTime: "تحديد الموقع الحالي",
        list: "إدارة المحاضرات",
        listSubtitle: "قم بإنشاء وإدارة ومراقبة جلساتك النشطة.",
        id: "معرف المحاضرة"
      },
      checkin: {
        title: "تسجيل الحضور",
        scan: "مسح رمز QR",
        verifying: "جاري التحقق من الموقع...",
        success: "تم تسجيل حضورك بنجاح!",
        errorLocation: "أنت خارج القطر المسموح به.",
        errorTime: "انتهى وقت تسجيل الحضور.",
        errorDuplicate: "لقد قمت بتسجيل الحضور مسبقاً لهذه المحاضرة.",
        errorGeneric: "فشل تسجيل الحضور.",
        distanceMsg: "تبعد {{distance}} متر عن موقع المحاضرة."
      },
      common: {
        back: "رجوع",
        save: "حفظ وإنشاء QR",
        cancel: "إلغاء",
        loading: "جاري التحميل...",
        status: "الحالة",
        date: "التاريخ",
        time: "الوقت",
        present: "حاضر",
        late: "متأخر",
        absent: "غائب",
        confirmDelete: "هل أنت متأكد أنك تريد حذف هذه المحاضرة؟"
      },
      nav: {
        dashboard: "لوحة التحكم",
        lectures: "المحاضرات",
        reports: "التقارير",
        settings: "الإعدادات",
        history: "سجل الحضور",
        logout: "تسجيل الخروج"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
