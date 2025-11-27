"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { ensureUserProfile } from "@/src/lib/database";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};
// -----------------------------------

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name.trim() || undefined,
              full_name: name.trim() || undefined,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await ensureUserProfile({
            uid: data.user.id,
            email: data.user.email!,
            displayName: name.trim() || null,
            photoURL: null,
          });
        }

        setInfo("Account created! Check your email to verify your account.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push("/home");
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || "Google sign-in failed";
      setError(msg);
      setLoading(false);
    }
  };

  const sendReset = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email above first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center relative overflow-hidden py-8 md:py-12 px-4">
      {/* Background Effects - Starts Immediately */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute -left-32 top-16 w-[55vw] h-[55vh] bg-cyan-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -right-24 bottom-0 w-[50vw] h-[60vh] bg-orange-500/10 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_40%,rgba(0,0,0,0.55)_100%)]"></div>
      </motion.div>

      {/* Main Container */}
      <motion.div
        className="relative z-10 w-full h-full max-w-6xl flex items-center justify-center gap-12"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* Phone Mockup */}
        <motion.div
          className="hidden lg:flex items-center justify-center w-full h-[80vh]"
          variants={itemVariants}
        >
          <div
            className="relative h-full w-160 max-w-full overflow-hidden rounded-2xl"
            style={{ contain: "layout paint size", willChange: "transform" }}
          >
            <Image
              src="/phoneMockup.png"
              alt="Riyura App Preview"
              fill
              className="relative z-10 drop-shadow-2xl animate-float object-cover object-center select-none"
              priority
            />
          </div>
        </motion.div>

        {/* Auth Container */}
        <motion.div className="w-full max-w-md" variants={itemVariants}>
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/landing" className="inline-flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Riyura Logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <span
                className="text-3xl font-bold tracking-wider"
                style={{ fontFamily: "'Bruno Ace', sans-serif" }}
              >
                RIYURA
              </span>
            </Link>
            <p
              className="text-gray-400 text-sm mt-2"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {isSignUp
                ? "Create your account to start streaming"
                : "Welcome back! Sign in to continue"}
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-[#1518215f] border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
            {/* Toggle Tabs */}
            <div className="relative flex gap-2 mb-8 bg-black/30 rounded-lg p-1">
              <button
                onClick={() => setIsSignUp(false)}
                className={`relative flex-1 py-3 rounded-md font-semibold uppercase tracking-wider transition-colors overflow-hidden ${
                  !isSignUp ? "text-white" : "text-gray-400 hover:text-white"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {!isSignUp && (
                  <motion.span
                    layoutId="tabHighlight"
                    className="absolute inset-0 rounded-md bg-linear-to-r from-orange-600 to-red-600 shadow-[0_0_24px_rgba(255,80,0,0.35)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </button>

              <button
                onClick={() => setIsSignUp(true)}
                className={`relative flex-1 py-3 rounded-md font-semibold uppercase tracking-wider transition-colors overflow-hidden ${
                  isSignUp ? "text-white" : "text-gray-400 hover:text-white"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {isSignUp && (
                  <motion.span
                    layoutId="tabHighlight"
                    className="absolute inset-0 rounded-md bg-linear-to-r from-orange-600 to-red-600 shadow-[0_0_24px_rgba(255,80,0,0.35)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Sign Up</span>
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={onSubmit}>
              <AnimatePresence initial={false}>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  required
                />
              </div>

              <AnimatePresence initial={false}>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {!isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                    className="flex items-center justify-between text-sm"
                  >
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded bg-black/30 border-white/10 text-orange-600 focus:ring-orange-500"
                      />
                      <span
                        className="ml-2 text-gray-400"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={sendReset}
                      disabled={loading}
                      className="text-orange-500 hover:text-orange-400 transition-colors disabled:opacity-60"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      Forgot password?
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              {info && (
                <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
                  {info}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-3 h-14 rounded-full overflow-hidden font-bold tracking-wider uppercase transition-all duration-300 mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Bruno Ace', sans-serif" }}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-linear-to-r from-orange-600 via-red-600 to-orange-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-linear-to-r from-orange-500 to-red-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                {/* Content */}
                <span className="relative z-10 text-white">
                  {loading
                    ? isSignUp
                      ? "Creating..."
                      : "Signing in..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </span>

                {/* Hover shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
              </button>
            </form>

            {/* Social Sign In */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span
                    className="px-4 text-gray-400 uppercase tracking-wider"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Or
                  </span>
                </div>
              </div>

              <div className="mt-6 gap-4 flex justify-center items-center">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg hover:border-white/20 transition-all disabled:opacity-60"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Continue with Google
                  </span>
                </button>
              </div>
            </div>
            {/* Terms */}
            {isSignUp && (
              <p
                className="mt-6 text-center text-xs text-gray-500"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                By signing up, you agree to our{" "}
                <a href="#" className="text-orange-500 hover:text-orange-400">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-orange-500 hover:text-orange-400">
                  Privacy Policy
                </a>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
