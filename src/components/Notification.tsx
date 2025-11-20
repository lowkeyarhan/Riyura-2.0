"use client";

import React from "react";
import { useNotification } from "@/src/lib/NotificationContext";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Notification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-5 left-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div className="relative w-[320px] flex items-center gap-3 p-4 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
              {/* Icon */}
              <div className="shrink-0">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">
                  {notification.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeNotification(notification.id)}
                className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
