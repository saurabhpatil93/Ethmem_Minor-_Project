import { HiCheckCircle } from 'react-icons/hi2';
import { HiPuzzlePiece, HiCpuChip, HiLockClosed } from 'react-icons/hi2';

export default function Pricing() {
  return (
    <section className="bg-gradient-to-br from-[#07120B] to-[#052116] rounded-xl sm:rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-16 my-12 sm:my-16 lg:my-24 text-white relative overflow-hidden">
      {/* subtle grid overlay like header */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] pointer-events-none"></div>
      {/* subtle backdrop orbs to keep visual continuity with header */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-800/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/8 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block bg-[#06200f] text-emerald-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Three Core Layers.<br />One Sovereign Identity.
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-sm sm:text-base">
            A browser extension that acts as your agent, on-device AI for private processing, 
            and local IndexedDB for safe storage and verification.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Browser Extension */}
          <div className="bg-[#071816] p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-emerald-900 flex flex-col">
            <div className="mb-6">
              
              <h3 className="text-lg sm:text-xl font-semibold">The Browser Extension</h3>
              <p className="text-emerald-400 text-sm mt-1 font-medium">The Frontend</p>
            </div>

            <div className="mt-auto">
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Built with JavaScript and Manifest V3, the extension is your personal AI agent living in the browser.
              </p>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-300">
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Capture Conversations:</strong> Securely injects into LLM pages to capture full exchanges</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Manage UI:</strong> View memories, settings, and trigger ZK-Proof generation</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Orchestrate:</strong> Command center for AI processing and local storage interactions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* On-Device AI - highlighted */}
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-2 border-teal-400/50 relative flex flex-col shadow-xl shadow-teal-500/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-teal-700 text-xs font-bold px-3 py-1 rounded-full shadow-lg">PRIVACY CORE</div>
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">The On-Device AI</h3>
              <p className="text-teal-100 text-sm mt-1 font-medium">The Private Processor</p>
            </div>

            <div className="mt-auto">
              <p className="text-white/90 text-sm mb-6 leading-relaxed">
                All intelligence happens locally. No conversation data ever leaves your machine.
              </p>
              <ul className="space-y-3 sm:space-y-4 text-sm text-white/90">
                <li className="flex items-start">
                  <HiCheckCircle className="text-teal-200 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Transformers.js:</strong> Runs optimized LaMini-Flan-T5 model in ONNX format via WebAssembly</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-teal-200 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Local Processing:</strong> Extracts key facts from conversations into structured JSON</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-teal-200 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Zero Server Calls:</strong> Complete privacy-first architecture running in your browser</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Local Storage */}
          <div className="bg-[#071816] p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-emerald-900 flex flex-col">
            <div className="mb-6">
              
              <h3 className="text-lg sm:text-xl font-semibold">Local Storage</h3>
              <p className="text-emerald-400 text-sm mt-1 font-medium">The Data Layer</p>
            </div>

            <div className="mt-auto">
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Persistent, localized storage living entirely within your browser.
              </p>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-300">
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">IndexedDB:</strong> Memories stored safely in your browser database</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Zero Cloud:</strong> No external servers, ensuring maximum privacy</span>
                </li>
                <li className="flex items-start">
                  <HiCheckCircle className="text-emerald-400 mr-3 text-lg flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Exportable:</strong> Easily backup and restore your memories via JSON</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}