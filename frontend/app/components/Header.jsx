"use client";
import { Rocket, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToStorage = () => {
    router.push('/storage');
  };

  return (
    <header className="bg-gradient-to-br from-[#0B2F1B] to-[#07120B] rounded-b-xl sm:rounded-b-2xl md:rounded-b-[3rem] p-4 sm:p-6 text-white relative overflow-hidden">
      {/* subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] pointer-events-none"></div>

      {/* gradient orbs (kept green-tinted to match theme) */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-800/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <nav className="px-2 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="EthMem logo" className="h-6 w-6 sm:h-10 sm:w-10 object-contain" />
            </div>
            <span className="text-white text-xl sm:text-3xl font-semibold">ETHMem</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <button
              onClick={handleGoToDashboard}
              className="hover:text-white transition-colors"
            >
              Dashboard
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/20 backdrop-blur-sm rounded-lg mx-2 sm:mx-6 mb-4 p-4">
            <div className="flex flex-col space-y-4 text-sm font-medium text-gray-300">
              <button
                onClick={() => {
                  handleGoToDashboard();
                  setIsMenuOpen(false);
                }}
                className="hover:text-white transition-colors py-2 text-left"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="px-2 sm:px-6 pt-8 sm:pt-12 pb-12 sm:pb-16 text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-3 py-2 shadow-inner">
              <span className="bg-emerald-400 text-black text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">Privacy-First</span>
              <span className="text-gray-300 pr-2 sm:pr-3 text-xs sm:text-sm">On-device AI • Encrypted Storage • On-Chain</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Your AI Memory, <br /> <span className="text-emerald-400">Your Data, Your Control</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            A privacy-first browser extension that builds your personal knowledge graph from AI conversations.
            On-device extraction, encrypted storage, and ZK-proof verification—giving every AI persistent context without compromising your privacy.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
            <button
              onClick={handleGoToDashboard}
              className="bg-emerald-400 hover:bg-emerald-500 text-black px-4 sm:px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              <span className="text-sm sm:text-base">Access Dashboard</span>
              <Rocket size={16} />
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('how-it-works');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white/5 hover:bg-white/10 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
              <span className="text-sm sm:text-base">Learn More</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8 mt-6 sm:mt-8 text-gray-300 px-4">
            <p className="text-xs sm:text-sm font-medium">Compatible With:</p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-2">
                <img alt="ChatGPT logo" className="h-4 w-4 sm:h-6 sm:w-6 rounded" src="/chatgpt2.png" />
                <span className="text-xs sm:text-sm">ChatGPT</span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="Claude logo" className="h-4 w-4 sm:h-6 sm:w-6 rounded" src="/claude.jpeg" />
                <span className="text-xs sm:text-sm">Claude</span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="Gemini logo" className="h-4 w-4 sm:h-6 sm:w-6 rounded" src="/gemini.png" />
                <span className="text-xs sm:text-sm">Gemini</span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="ASI logo" className="h-4 w-4 sm:h-6 sm:w-6 rounded" src="/asi.png" />
                <span className="text-xs sm:text-sm">ASI</span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="LLaMA logo" className="h-4 w-4 sm:h-6 sm:w-6 rounded" src="/llama.png" />
                <span className="text-xs sm:text-sm">LLaMA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
