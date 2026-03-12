
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import { User, Comic, Notification, SubscriptionTier, GradingResult, UserRole } from './types';
import { storageService } from './services/storageService';
import { supabase } from './supabase';
import { Shield } from 'lucide-react';

// Lazy load pages for better initial performance
const GradingPage = lazy(() => import('./pages/GradingPage'));
const GradingResultPage = lazy(() => import('./pages/GradingResultPage'));
const MarketplaceSignup = lazy(() => import('./pages/MarketplaceSignup'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AddComicPage = lazy(() => import('./pages/AddComicPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ArtLabPage = lazy(() => import('./pages/ArtLabPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TickerTape = lazy(() => import('./components/TickerTape'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
  </div>
);

const DatabaseOfflineView = ({ onDemoMode }: { onDemoMode: () => void }) => (
  <div className="min-h-screen bg-[#1a2332] flex items-center justify-center p-4">
    <div className="bg-white/5 border border-[#fbbf24] p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
      <div className="w-20 h-20 bg-[#fbbf24]/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-[#fbbf24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 className="text-3xl comic-font text-[#fbbf24] mb-4 uppercase">Vault Connection Required</h1>
      <p className="text-gray-300 mb-8">
        The Vault's cloud connection hasn't been established. Please check your environment configuration.
      </p>
      <div className="space-y-3">
        <button onClick={() => window.location.reload()} className="w-full bg-[#fbbf24] text-[#1a2332] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all">
          RETRY CONNECTION
        </button>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authSession, setAuthSession] = useState<any>(null);
  const [comics, setComics] = useState<Comic[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gradingResult, setGradingResult] = useState<{ result: GradingResult, images: string[], title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isFetching = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setDbError(true);
      return;
    }

    const initAuth = async () => {
      try {
        // Safety timeout for getSession
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Auth session timeout")), 5000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (session && !isFetching.current) {
          isFetching.current = true;
          setAuthSession(session.user);
          // Don't await fetchUserData here to unblock UI faster if possible
          fetchUserData(session.user.id, session.user.email);
          isFetching.current = false;
        } else if (!session) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        // If auth fails, we still want to stop loading so we can show login
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (session) {
        setAuthSession(session.user);
        if (!isFetching.current) {
          isFetching.current = true;
          await fetchUserData(session.user.id, session.user.email);
          isFetching.current = false;
        }
      } else {
        setAuthSession(null);
        setUser(null);
        setComics([]);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const enterDemoMode = () => {
    const demoUser: User = {
      id: 'demo-hero',
      username: 'Demo Hero',
      role: UserRole.USER,
      subscription: SubscriptionTier.VAULT_ELITE,
      freeScansRemaining: 999,
      purchasedScansRemaining: 0,
      hasArtLab: true,
      isSeller: true,
      stripeConnected: true,
      joinedDate: Date.now()
    };
    setUser(demoUser);
    setAuthSession({ uid: 'demo-hero', email: 'demo@example.com' });
    setIsDemoMode(true);
    setComics([
      {
        id: 'demo-1',
        ownerId: 'demo-hero',
        title: 'Amazing Fantasy #15',
        issueNumber: '15',
        publisher: 'Marvel',
        publishYear: 1962,
        conditionRating: 9.6,
        purchasePrice: 50000,
        estimatedValue: 1100000,
        coverImage: 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?q=80&w=300&auto=format&fit=crop',
        notes: 'First appearance of Spider-Man. Pristine condition.',
        isForSale: false,
        gradingReport: {
          grade: 9.6,
          estimatedValue: 1100000,
          analysis: "Exceptional copy with vibrant colors and sharp corners.",
          corners: "Sharp and well-defined.",
          edges: "Clean with no chipping.",
          surface: "High gloss, minimal scuffing.",
          centering: "Near perfect 50/50.",
          images: ['https://images.unsplash.com/photo-1588497859490-85d1c17db96d?q=80&w=300&auto=format&fit=crop'],
          date: Date.now()
        }
      },
      {
        id: 'demo-2',
        ownerId: 'demo-hero',
        title: 'Detective Comics #27',
        issueNumber: '27',
        publisher: 'DC',
        publishYear: 1939,
        conditionRating: 8.0,
        purchasePrice: 120000,
        estimatedValue: 2100000,
        coverImage: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=300&auto=format&fit=crop',
        notes: 'First appearance of Batman. Historic piece.',
        isForSale: true,
        listingPrice: 2500000,
        gradingReport: {
          grade: 8.0,
          estimatedValue: 2100000,
          analysis: "Solid mid-high grade copy of a Golden Age classic.",
          corners: "Slight blunting on bottom right.",
          edges: "Minor wear consistent with age.",
          surface: "Some light foxing on back cover.",
          centering: "Slightly off-center to the left.",
          images: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=300&auto=format&fit=crop'],
          date: Date.now()
        }
      }
    ]);
    setLoading(false);
    setDbError(false);
  };

  const fetchUserData = async (userId: string, email?: string) => {
    if (!userId) return;
    
    try {
      // 1. Fetch Profile FIRST (essential for app state)
      // Use a shorter timeout for the profile fetch specifically
      const profilePromise = storageService.getProfile(userId);
      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timed out")), 10000)
      );

      let profile = await Promise.race([profilePromise, profileTimeout]) as User | null;
      
      if (!profile) {
        console.log("No profile found, creating default...");
        const defaultName = email?.split('@')[0] || 'Hero';
        profile = {
          id: userId,
          username: defaultName,
          displayName: defaultName,
          role: UserRole.USER,
          subscription: SubscriptionTier.FREE,
          freeScansRemaining: 3,
          purchasedScansRemaining: 0,
          hasArtLab: false,
          isSeller: false,
          stripeConnected: false,
          joinedDate: Date.now()
        };
        await storageService.createProfile(userId, profile);
      }

      setUser(profile);
      setLoading(false); // UNBLOCK UI as soon as we have the profile
      setDbError(false);
      console.log("Profile sync complete, unblocking UI");

      // 2. Fetch Comics and Notifications in background
      // This won't block the main app loading spinner
      Promise.all([
        storageService.getComics(userId),
        storageService.getNotifications(userId)
      ]).then(([userComics, userNotifications]) => {
        setComics(userComics);
        setNotifications(userNotifications);
        console.log("Background vault sync complete");
      }).catch(err => {
        console.error("Background sync error:", err);
        // We don't set dbError here because the user can still use the app
      });

    } catch (err) {
      console.error("Error syncing with vault:", err);
      setDbError(true);
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (user && supabase) {
      try {
        await storageService.updateProfile(user.id, updates);
        setUser(prev => prev ? { ...prev, ...updates } : null);
      } catch (err) {
        console.error("Vault Update Error:", err);
      }
    }
  };

  const handleGradingComplete = (result: GradingResult, images: string[], title: string) => {
    setGradingResult({ result, images, title });
  };

  const saveToCollection = async (comic?: Comic, metadataOverride?: { title: string, issueNumber: string, publisher: string, publishYear: string }) => {
    if (!user) return;
    
    // In Demo Mode, we allow saving to local state even if Supabase is down
    if (!supabase && !isDemoMode) {
      alert("Database connection is not ready. Please try again or use Demo Mode.");
      return;
    }

    setIsSaving(true);
    try {
      if (comic) {
        if (supabase) {
          await storageService.saveComic(comic);
        }
        setComics(prev => [comic, ...prev]);
        navigate('/collection');
        return;
      }
      
      if (!gradingResult) return;

      const comicId = Math.random().toString(36).substr(2, 9);
      
      let uploadedImageUrls: string[] = gradingResult.images;

      // Only attempt upload if Supabase is initialized
      if (supabase) {
        try {
          uploadedImageUrls = await Promise.all(
            gradingResult.images.map(async (base64, idx) => {
              return await storageService.uploadFile(`grading_scans/${user.id}/${comicId}/scan_${idx}.jpg`, base64);
            })
          );
        } catch (uploadError) {
          console.error("Image upload failed, falling back to local data:", uploadError);
          // Fallback to base64 if upload fails, so the user doesn't lose data
          uploadedImageUrls = gradingResult.images;
        }
      }

      const finalTitle = metadataOverride?.title || gradingResult.title || gradingResult.result.identifiedTitle || 'Unknown Comic';
      const finalIssue = metadataOverride?.issueNumber || '?';
      const finalPublisher = metadataOverride?.publisher || 'AI Identified';
      const finalYear = metadataOverride?.publishYear ? Number(metadataOverride.publishYear) : new Date().getFullYear();

      const newComic: Comic = {
        id: comicId,
        ownerId: user.id,
        title: finalTitle,
        issueNumber: finalIssue,
        publisher: finalPublisher,
        publishYear: finalYear,
        conditionRating: gradingResult.result.grade,
        purchasePrice: 0,
        estimatedValue: gradingResult.result.estimatedValue,
        coverImage: uploadedImageUrls[0],
        notes: gradingResult.result.analysis,
        isForSale: false,
        gradingReport: { 
          ...gradingResult.result, 
          images: uploadedImageUrls, 
          date: Date.now() 
        }
      };

      if (supabase) {
        await storageService.saveComic(newComic);
      }
      
      setComics(prev => [newComic, ...prev]);
      
      if (user.subscription !== SubscriptionTier.VAULT_ELITE) {
        if (user.freeScansRemaining > 0) {
          handleUpdateUser({ freeScansRemaining: user.freeScansRemaining - 1 });
        } else if (user.purchasedScansRemaining > 0) {
          handleUpdateUser({ purchasedScansRemaining: user.purchasedScansRemaining - 1 });
        }
      }

      setGradingResult(null);
      alert("COMIC SECURED IN VAULT!");
      navigate('/collection');
    } catch (err) { 
      console.error(err);
      alert("Failed to save to vault: " + (err instanceof Error ? err.message : "Internal Error")); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComic = async (id: string) => {
    if (confirm("Permanently remove from vault?")) {
      try {
        await storageService.deleteComic(id);
        setComics(prev => prev.filter(c => c.id !== id));
      } catch (err) { alert("Vault deletion failed."); }
    }
  };

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2332] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mx-auto mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Initializing Vault...</p>
      </div>
    </div>
  );

  if (dbError) return (
    <div className="min-h-screen bg-[#1a2332] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-[#dc2626]/20 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-12 h-12 text-[#dc2626]" />
        </div>
        <h1 className="text-3xl comic-font text-[#fbbf24] uppercase">Vault Sync Error</h1>
        <p className="text-gray-400 max-w-md mx-auto">We're having trouble connecting to your vault. This might be a temporary network issue.</p>
        <button onClick={() => window.location.reload()} className="bg-[#fbbf24] text-[#1a2332] px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all">
          Retry Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a2332] text-white selection:bg-[#fbbf24] selection:text-[#1a2332]">
      <Navbar user={user} onLogout={handleLogout} notifications={notifications} />
      <Suspense fallback={<LoadingFallback />}>
        <TickerTape userId={user?.id} />
      </Suspense>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={authSession ? <Navigate to="/" /> : <AuthPage onDemoLogin={enterDemoMode} />} />
            <Route path="/" element={authSession ? (user ? <Dashboard user={user} comics={comics} /> : <div className="text-center py-20"><div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p>Syncing Profile...</p></div>) : <LandingPage />} />
            <Route path="/marketplace" element={authSession ? (user?.isSeller ? <Marketplace user={user} /> : <MarketplaceSignup user={user!} onUpdateUser={handleUpdateUser} />) : <Navigate to="/login" />} />
            <Route path="/collection/new" element={authSession ? <AddComicPage user={user!} onAdd={saveToCollection} /> : <Navigate to="/login" />} />
            <Route path="/grading" element={authSession ? (gradingResult ? <GradingResultPage user={user!} result={gradingResult.result} images={gradingResult.images} title={gradingResult.title} onSaveToCollection={(metadata) => saveToCollection(undefined, metadata as any)} onReset={() => setGradingResult(null)} isSaving={isSaving} isDemoMode={isDemoMode} /> : <GradingPage user={user!} onGradingComplete={handleGradingComplete} />) : <Navigate to="/login" />} />
            <Route path="/collection" element={authSession ? <CollectionPage user={user!} comics={comics} onDelete={handleDeleteComic} onImport={() => {}} /> : <Navigate to="/login" />} />
            <Route path="/billing" element={authSession ? <SubscriptionPage user={user!} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
            <Route path="/messages" element={authSession ? <MessagesPage user={user!} /> : <Navigate to="/login" />} />
            <Route path="/wishlist" element={authSession ? <WishlistPage user={user!} /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={authSession ? <NotificationsPage user={user!} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={authSession ? <SettingsPage user={user!} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={authSession ? <ProfilePage user={user!} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
            <Route path="/community" element={authSession ? <CommunityPage user={user!} /> : <Navigate to="/login" />} />
            <Route path="/art-lab" element={authSession ? <ArtLabPage user={user!} /> : <Navigate to="/login" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/5 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="comic-font text-[#dc2626] text-2xl drop-shadow-[1px_1px_0_rgba(251,191,36,1)] mb-2">COMIC VAULT</h3>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest max-w-xs">
              The ultimate AI-powered comic collection management and grading platform.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors">Legal Disclaimer</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Community</h4>
              <ul className="space-y-2">
                <li><Link to="/marketplace" className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors">Marketplace</Link></li>
                <li><Link to="/messages" className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors">Vault Messages</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
            © 2026 Comic Vault Interactive • Built for collectors, by collectors.
          </p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
