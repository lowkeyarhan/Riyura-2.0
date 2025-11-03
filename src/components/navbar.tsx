"use client";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
      <div className="px-8 md:px-16 lg:px-20 py-4 flex items-center justify-between">
        <div className="hidden md:flex items-center justify-between gap-16 text-sm uppercase tracking-wider text-gray-300">
          <button
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            H O M E
          </button>
          <button
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            W A T C H L I S T
          </button>
          <button
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            S E A R C H
          </button>
          <button
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            E X P L O R E
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile Box */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all">
            <span className="text-sm uppercase tracking-wider text-gray-300">
              U S E R
            </span>
            <div className="w-8 h-8 rounded overflow-hidden">
              <img
                src="/profile-avatar.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient if image doesn't exist
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.classList.add(
                    "bg-gradient-to-br",
                    "from-blue-500",
                    "to-cyan-500",
                    "flex",
                    "items-center",
                    "justify-center"
                  );
                  e.currentTarget.parentElement!.innerHTML =
                    '<span class="text-xs font-bold">K</span>';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
