
import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { db } from '../services/db';
import { auth, firestore } from '../services/firebase';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (role: 'user' | 'admin') => void;
  onNavigate: (view: 'landing' | 'signup' | 'login' | 'forgot') => void;
  view: 'login' | 'signup' | 'forgot';
}

const Auth: React.FC<AuthProps> = ({ onLogin, onNavigate, view }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const settings = db.getSystemSettings();

    try {
        if (view === 'signup') {
             // Check if registrations allowed
             if (!settings.allowRegistrations) {
                 throw new Error("New registrations are currently disabled by administrator.");
             }

             // Firebase Signup (Compat Syntax)
             const userCredential = await auth.createUserWithEmailAndPassword(email, password);
             const uid = userCredential.user?.uid;
             
             if (!uid) throw new Error("Failed to retrieve user ID.");

             // Create User Profile Data
             const newUser: UserType = {
                 id: uid,
                 email: email,
                 name: name || 'New User',
                 role: 'user',
                 balance: 0,
                 status: 'active',
                 joinedDate: new Date().toISOString().split('T')[0],
                 projectsCount: 0,
                 apiKey: `sk_live_${Math.random().toString(36).substr(2,18)}`
             };

             // Save to Firestore (Compat Syntax)
             try {
                await firestore.collection("users").doc(uid).set(newUser);
             } catch (dbError: any) {
                console.error("Firestore write failed:", dbError);
                if (dbError.code === 'permission-denied') {
                    throw new Error("Database Permission Denied. Please ensure your Firestore Rules allow writes (see Firebase Console). Account created in Auth only.");
                }
             }

             // Sync to Local App State (Bridge for legacy components)
             db.syncUser(newUser);

             // Sync Transactions (Likely empty for new user, but good practice)
             await db.syncTransactions(newUser.id, newUser.role);

             onLogin('user');

        } else if (view === 'login') {
             // Firebase Login (Compat Syntax)
             const userCredential = await auth.signInWithEmailAndPassword(email, password);
             const uid = userCredential.user?.uid;
             
             if (!uid) throw new Error("Failed to retrieve user ID.");

             // Fetch Profile from Firestore (Compat Syntax)
             let userData: UserType | null = null;
             
             try {
                const userDoc = await firestore.collection("users").doc(uid).get();
                if (userDoc.exists) {
                    userData = userDoc.data() as UserType;
                }
             } catch (dbError: any) {
                 console.error("Firestore read failed:", dbError);
                 if (dbError.code === 'permission-denied') {
                     throw new Error("Database Permission Denied. Please ensure your Firestore Rules allow reads.");
                 }
             }
             
             if (userData) {
                 // Maintenance Check
                 if (settings.maintenanceMode && userData.role !== 'admin') {
                     throw new Error('System is currently under maintenance. Please try again later.');
                 }

                 if (userData.status === 'suspended') {
                     throw new Error('Your account has been suspended. Please contact support.');
                 }

                 // Sync to Local App State
                 db.syncUser(userData);

                 // Sync Transactions (Fetch from cloud)
                 await db.syncTransactions(userData.id, userData.role);

                 onLogin(userData.role);
             } else {
                 // Fallback if auth exists but no db record
                 console.warn("User authenticated but no profile found in DB. Creating default.");
                 const defaultUser: UserType = {
                     id: uid,
                     email: email,
                     name: 'User',
                     role: 'user',
                     balance: 0,
                     status: 'active',
                     joinedDate: new Date().toISOString().split('T')[0],
                     projectsCount: 0
                 };
                 
                 // Try to write it again if it was missing
                 try {
                    await firestore.collection("users").doc(uid).set(defaultUser);
                 } catch(e) { /* ignore permission error here to let user in */ }

                 db.syncUser(defaultUser);
                 await db.syncTransactions(defaultUser.id, defaultUser.role);
                 
                 onLogin('user');
             }
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let msg = "Authentication failed.";
        
        // Specific Firebase Auth Errors
        const code = err.code || '';
        const message = err.message || '';

        if (code === 'auth/email-already-in-use') msg = "That email address is already in use! Please login.";
        if (code === 'auth/invalid-email') msg = "That email address is invalid!";
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
            msg = "Invalid email or password.";
        }
        if (code === 'auth/configuration-not-found') msg = "Authentication not enabled in Firebase Console. Please enable 'Email/Password' provider.";
        if (code === 'auth/operation-not-allowed') msg = "Email/Password login is currently disabled in the system configuration.";
        if (code === 'auth/network-request-failed') msg = "Network error. Please check your internet connection.";
        if (code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        
        // Firestore Permission Errors
        if (code === 'permission-denied') msg = "Database Permission Denied. Please update your Firestore Rules in the Firebase Console to allow authenticated writes.";

        if (message && msg === "Authentication failed.") msg = message;
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Back Button */}
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
            <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <span className="text-red-700 text-xs font-bold leading-relaxed">{error}</span>
            </div>
        )}

        {view === 'forgot' ? (
             <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-500 mb-8">Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={(e) => { e.preventDefault(); alert('Reset link sent!'); onNavigate('login'); }} className="space-y-6">
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                required
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <button className="w-full bg-black text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors">
                        Send Reset Link
                    </button>
                    <div className="text-center">
                        <button type="button" onClick={() => onNavigate('login')} className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-black">
                            Back to Login
                        </button>
                    </div>
                </form>
             </div>
        ) : (
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-gray-500 mb-8">
                    {view === 'login' ? 'Enter your credentials to access your dashboard.' : 'Start your first traffic campaign today.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {view === 'signup' && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Password</label>
                            {view === 'login' && (
                                <button type="button" onClick={() => onNavigate('forgot')} className="text-[10px] font-bold text-[#ff4d00] uppercase tracking-wider hover:text-black">Forgot?</button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : (
                            <>
                                {view === 'login' ? 'Sign In' : 'Get Started'} <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button 
                        onClick={() => onNavigate(view === 'login' ? 'signup' : 'login')}
                        className="text-sm font-black text-gray-900 hover:text-[#ff4d00] uppercase tracking-wide"
                    >
                        {view === 'login' ? 'Create Account' : 'Login Here'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
