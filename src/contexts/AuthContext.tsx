'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, facilityId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              facilityId: userData.facilityId,
              isActive: userData.isActive,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: new Date(),
            });
          } else {
            // User document doesn't exist, create it
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || '',
              role: 'receptionist',
              facilityId: '',
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: new Date(),
              lastLogin: new Date(),
            });
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.isActive) {
          throw new Error('Account is deactivated. Please contact administrator.');
        }
        
        // Update last login
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          lastLogin: new Date(),
        });
      } else {
        throw new Error('User account not found. Please contact administrator.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole, facilityId: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Create user document in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        name,
        role,
        facilityId,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUser,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      setUser(newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...updates,
        updatedAt: new Date(),
      });
      
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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