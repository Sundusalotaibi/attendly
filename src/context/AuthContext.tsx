import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  totalLectures?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  isSigningIn: boolean;
  signIn: (role: 'instructor' | 'student') => Promise<void>;
  signInByEmail: (email: string, pass: string) => Promise<void>;
  signUpByEmail: (email: string, pass: string, name: string, role: 'instructor' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Listen to profile changes
          const profileRef = doc(db, 'users', user.uid);
          onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          }, (error) => {
            console.error("Profile listen error:", error);
          });
        } catch (error) {
          console.error("Error setting up profile listener:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = async (role: 'instructor' | 'student') => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          role,
          totalLectures: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        // This is a known issue when two popups are requested.
        // We can ignore it as the user probably clicked twice.
        console.warn("Sign-in popup request was cancelled due to another request.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.warn("Sign-in popup was closed by the user.");
      } else {
        console.error("Sign in error:", error);
        throw error;
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInByEmail = async (email: string, pass: string) => {
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email sign in error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpByEmail = async (email: string, pass: string, name: string, role: 'instructor' | 'student') => {
    setIsSigningIn(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      
      await updateProfile(user, { displayName: name });
      
      const userRef = doc(db, 'users', user.uid);
      const newProfile: UserProfile = {
        uid: user.uid,
        name,
        email,
        role,
        totalLectures: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Email sign up error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAuthReady, 
      isSigningIn, 
      signIn, 
      signInByEmail,
      signUpByEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
