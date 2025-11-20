"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center space-x-1.5">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="h-3 w-3 rounded-full bg-white"
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: index * 0.2, // This creates the "wave" effect
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots;
