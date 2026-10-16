export default function FAQ() {
  return (
    <section className="bg-gradient-to-br from-[#07120B] to-[#052116] rounded-t-xl sm:rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-16 my-0 sm:my-16 lg:my-24 text-white relative overflow-hidden">
      {/* subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] pointer-events-none"></div>
      {/* decorative orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-800/8 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Frequently Asked<br />Questions
          </h2>
          <p className="text-gray-400 mt-4 text-sm sm:text-base">Have questions about secure local memory? We've got answers.</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <details className="bg-gradient-to-br from-[#07120B] to-[#0E1620] rounded-2xl p-0 overflow-hidden">
            <summary className="font-semibold flex justify-between items-center px-4 sm:px-6 py-4 cursor-pointer text-sm sm:text-base">
              <span>Where is my data actually stored?</span>
              <span className="inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 bg-emerald-600/10 ring-1 ring-emerald-400/20 rounded-full text-emerald-200 text-sm sm:text-base">+</span>
            </summary>
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Your data is stored locally within your browser using IndexedDB. It never leaves your device, ensuring complete privacy and security.</p>
            </div>
          </details>
          <details className="bg-gradient-to-br from-[#07120B] to-[#0E1620] rounded-2xl p-0 overflow-hidden">
            <summary className="font-semibold flex justify-between items-center px-4 sm:px-6 py-4 cursor-pointer text-sm sm:text-base">
              <span>What is a secure identity?</span>
              <span className="inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 bg-emerald-600/10 ring-1 ring-emerald-400/20 rounded-full text-emerald-200 text-sm sm:text-base">+</span>
            </summary>
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Your secure identity acts as a universal, self-sovereign login and a root for your protected data, allowing you to control your information without relying on an intrusive central authority.</p>
            </div>
          </details>
          <details className="bg-gradient-to-br from-[#07120B] to-[#0E1620] rounded-2xl p-0 overflow-hidden">
            <summary className="font-semibold flex justify-between items-center px-4 sm:px-6 py-4 cursor-pointer text-sm sm:text-base">
              <span>Can I use this with any LLM?</span>
              <span className="inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 bg-emerald-600/10 ring-1 ring-emerald-400/20 rounded-full text-emerald-200 text-sm sm:text-base">+</span>
            </summary>
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Yes! EthMem is designed to be model-agnostic. You can connect it to centralized models like those from OpenAI or to open-source models running locally on your hardware.</p>
            </div>
          </details>
          <details className="bg-gradient-to-br from-[#07120B] to-[#0E1620] rounded-2xl p-0 overflow-hidden">
            <summary className="font-semibold flex justify-between items-center px-4 sm:px-6 py-4 cursor-pointer text-sm sm:text-base">
              <span>What happens if I lose my wallet/keys?</span>
              <span className="inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 bg-emerald-600/10 ring-1 ring-emerald-400/20 rounded-full text-emerald-200 text-sm sm:text-base">+</span>
            </summary>
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Since data is stored locally in your browser, clearing your browser data or uninstalling the extension may result in data loss. We highly recommend using the export feature regularly to backup your memories.</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
