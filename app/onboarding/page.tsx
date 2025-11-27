"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function DarkMoodWelcome() {
  const { firstName } = useAuth();
  const steps = [
    { head: `Hi there${firstName ? ", " + firstName : ""}`, sub: "" },
    { head: "Welcome to Riyura", sub: "" },
    { head: "Getting things ready", sub: "Just a moment" },
    { head: "Your data is highly secured", sub: "AES-256-GCM encrypted" },
    {
      head: "Install an ad blocker to prevent ads",
      sub: "We recommend Ghostery or AdGuard",
    },
    { head: "Building your profile", sub: "Just a little more" },
    { head: "Almost there", sub: "" },
  ];

  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (index >= steps.length) return;

    let stepDuration = 4500;

    if (index === 0) {
      stepDuration = 3500;
    } else if (index === steps.length - 1) {
      stepDuration = 3500;
    } else if (index === 4) {
      stepDuration = 5000;
    }

    const timer = setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black text-white font-sans">
      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 bg-[#000000] z-0" />

      <motion.div
        animate={{
          x: ["-20%", "10%", "-20%"],
          y: ["-10%", "20%", "-10%"],
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[20%] h-[60vh] w-[60vh] rounded-full bg-[#155e75] blur-[120px] z-1"
        style={{ mixBlendMode: "normal" }}
      />

      <motion.div
        animate={{
          x: ["20%", "-10%", "20%"],
          y: ["10%", "-20%", "10%"],
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[20%] h-[60vh] w-[60vh] rounded-full bg-[#9a3412] blur-[120px] z-1"
        style={{ mixBlendMode: "screen" }}
      />

      <div className="absolute inset-0 z-2 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-3 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150 mix-blend-overlay" />

      {/* --- TEXT CONTENT --- */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl">
        <AnimatePresence
          mode="wait"
          onExitComplete={async () => {
            if (index === steps.length) {
              // Update onboarding status in DB
              if (typeof window !== "undefined" && supabase && firstName) {
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                if (session?.user?.id) {
                  await supabase
                    .from("profiles")
                    .update({ onboarded: true })
                    .eq("id", session.user.id);
                }
              }
              router.push("/home");
            }
          }}
        >
          {/* Only render if index is within bounds of the array */}
          {index < steps.length && (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                scale: 1.05,
                filter: "blur(10px)",
                transition: { duration: 1.0, ease: "easeInOut" },
              }}
              transition={{
                duration: 2.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center gap-6"
            >
              <h1
                className="text-4xl md:text-6xl font-light tracking-tight text-white/90 antialiased"
                style={{
                  fontFamily: '"Segoe UI Variable Display", sans-serif',
                }}
              >
                {steps[index].head}
              </h1>

              {steps[index].sub && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 1.5 }}
                  className="text-lg md:text-2xl text-neutral-400 font-light tracking-wide"
                >
                  {steps[index].sub}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
