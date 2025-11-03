"use client";

import React from "react";
import Banner from "@/src/components/banner";
import Navbar from "@/src/components/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      {/* Banner Component */}
      <Banner />

      {/* Add more sections below the banner as needed */}
      {/* Example: Movie rows, trending content, etc. */}
    </div>
  );
}
