export default function HowItWorks() {
  return (
    <section id="how-it-works" className="my-12 sm:my-16 lg:my-24 px-4">
      <div className="text-center mb-8 sm:mb-16">
        <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-lg">
          HOW IT WORKS
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
          Your Memory, Your Identity,<br />Your Control.
        </h2>
        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
          EthMem connects to your favorite LLMs and dApps, creating a unified, persistent memory layer that is cryptographically tied to your local device and securely stored.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Download Extension Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 p-8 sm:p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-emerald-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative text-center">
            <div className="flex justify-center mb-6">
              <img
                alt="EthMem browser extension"
                src="/extension.png"
                className="w-48 sm:w-64 h-auto rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <h3 className="font-bold text-2xl text-gray-900 group-hover:text-emerald-700 transition-colors mb-2">Download Extension</h3>
            <p className="text-sm text-emerald-600 font-semibold mb-4">Get Started</p>

            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Download our browser extension to enable EthMem to connect with your browser and persist memory securely. It's your gateway to private, local AI memory.
            </p>

            <div className="flex justify-center pt-4 border-t border-emerald-100">
              <a
                href="/Ethmem.zip"
                download
                aria-label="Download EthMem extension zip"
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Download Extension
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
