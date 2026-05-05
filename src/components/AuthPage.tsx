import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, CheckCircle2, Github, Linkedin, Shield } from "lucide-react";
import { useCanvasStore } from "../store/canvasStore";

export function AuthPage() {
  const { setCurrentView } = useCanvasStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const syncUserToFirestore = async (user: any) => {
    if (!db) return;
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        createdAt: Date.now()
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!auth) {
      toast.error("Firebase not configured");
      return;
    }
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(cred.user);
        toast.success("Welcome back!");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(cred.user);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await syncUserToFirestore(cred.user);
      toast.success("Logged in with Google!");
    } catch (error: any) {
       console.error("Google Auth Error:", error);
       if (error.code === "auth/unauthorized-domain") {
         toast.error("Domain unauthorized. Please add " + window.location.hostname + " to 'Authorized domains' in Firebase Console.", { duration: 8000 });
       } else if (error.code === "auth/operation-not-allowed") {
         toast.error("Google sign-in is not enabled in Firebase Console.", { duration: 8000 });
       } else {
         toast.error(error.message);
       }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await syncUserToFirestore(cred.user);
      toast.success("Logged in with Github!");
    } catch (error: any) {
       console.error("Github Auth Error:", error);
       if (error.code === "auth/unauthorized-domain") {
         toast.error("Domain unauthorized. Please add " + window.location.hostname + " to 'Authorized domains' in Firebase Console.", { duration: 8000 });
       } else if (error.code === "auth/operation-not-allowed") {
         toast.error("GitHub sign-in is not enabled. Go to Firebase Console -> Authentication -> Sign-in method to enable it with your GitHub Client ID/Secret.", { duration: 10000 });
       } else {
         toast.error("Github login failed: " + error.message);
       }
    } finally {
      setLoading(false);
    }
  };

  const signInWithLinkedin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new OAuthProvider('linkedin.com');
      const cred = await signInWithPopup(auth, provider);
      await syncUserToFirestore(cred.user);
      toast.success("Logged in with LinkedIn!");
    } catch (error: any) {
       console.error("LinkedIn Auth Error:", error);
       if (error.code === "auth/unauthorized-domain") {
         toast.error("Domain unauthorized. Please add " + window.location.hostname + " to 'Authorized domains' in Firebase Console.", { duration: 8000 });
       } else if (error.code === "auth/operation-not-allowed") {
         toast.error("LinkedIn sign-in is not enabled. Go to Firebase Console -> Authentication -> Sign-in method to enable it.", { duration: 10000 });
       } else {
         toast.error("LinkedIn login failed or not configured yet. Error: " + error.message);
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-100">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113]">
        {/* Left Side - Brand & Value Prop */}
        <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-12 text-white justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-lg tracking-tighter shadow-sm border border-white/20">L</div>
            <span className="font-semibold text-2xl tracking-tight">LuminaBI</span>
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Turn your data into <br/>
              <span className="text-pink-200">beautiful insights</span>
            </h1>
            <p className="text-violet-100 text-lg max-w-sm">
              Connect datasets, generate AI-powered dashboards, and discover powerful data narratives in seconds.
            </p>
            <div className="space-y-4 pt-4">
              {['AI Dashboard Generation', 'Interactive Visualizations', 'Real-time Analytics'].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-violet-100">
                  <CheckCircle2 className="w-5 h-5 text-pink-300" />
                  <span className="font-medium text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-violet-200/80 font-medium tracking-wide">
            © {new Date().getFullYear()} LuminaBI
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 md:p-16 relative">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight">{isLogin ? "Welcome back" : "Create an account"}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {isLogin ? "Enter your credentials to access your workspace" : "Sign up to start building beautiful dashboards"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  onClick={() => {
                    const demoUser = { uid: 'demo-user', email: 'guest@luminabi.demo', displayName: 'Guest User' };
                    localStorage.setItem('lumina_demo_user', JSON.stringify(demoUser));
                    window.location.reload();
                  }}
                >
                  Continue as Guest
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#111113] px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-0"
                onClick={signInWithGoogle}
                disabled={loading}
                title="Continue with Google"
              >
                <svg className="w-5 h-5 text-slate-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
                  <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9.04V8h9.613a9.23 9.23 0 0 1-.22 4.195 8.91 8.91 0 0 1-9.593 5.888Z" clipRule="evenodd"/>
                </svg>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-0"
                onClick={signInWithGithub}
                disabled={loading}
                title="Continue with Github"
              >
                <Github className="w-5 h-5 text-slate-800 dark:text-white" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-0 text-[#0a66c2]"
                onClick={signInWithLinkedin}
                disabled={loading}
                title="Continue with LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
            <div className="pt-6 flex items-center justify-center gap-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setCurrentView('privacy')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Privacy Policy
              </button>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-xs text-slate-400 font-medium cursor-default">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
