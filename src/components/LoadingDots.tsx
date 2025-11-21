"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

const LoadingDots = () => {
  const dotVariants: Variants = {
    initial: { y: 0, scaleY: 1 },
    animate: (index: number) => ({
      y: [0, -10, 0],
      scaleY: [1, 1.3, 0.8, 1],
      scaleX: [1, 0.8, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.15,
      },
    }),
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          custom={index}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        />
      ))}
    </div>
  );
};

export default LoadingDots;
