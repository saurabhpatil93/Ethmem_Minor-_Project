export default function Testimonials() {
  return (
    <section className="my-12 sm:my-16 lg:my-24 px-4">
      <div className="text-center mb-8 sm:mb-16">
        <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-lg">
          MEET THE BUILDERS
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
          Built by passionate<br />developers
        </h2>
        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
          Three builders pushing the boundaries of Web3 and AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 max-w-7xl mx-auto">
        {/* Ekas Card */}
        <div className="group relative bg-gradient-to-br from-white to-emerald-50 p-8 sm:p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-emerald-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    alt="Gurjot"
                    className="w-20 h-20 rounded-2xl mr-4 ring-4 ring-emerald-200 shadow-lg object-cover group-hover:ring-emerald-400 transition-all duration-300 bg-emerald-100"
                    src="/testimonals/placeholder.png" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-emerald-700 transition-colors">Gurjot Singh</h3>
                  <p className="text-sm text-emerald-600 font-semibold"> Dev</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[100px]">
              "Passionate about building privacy-focused solutions that put users in control of their data. Creating the future of local AI memory systems securely, one step at a time."
            </p>

            <div className="flex gap-3 pt-4 border-t border-emerald-100">
              <a 
                href="https://github.com/gurjotsingh74125" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Rishi Card */}
        <div className="group relative bg-gradient-to-br from-white to-teal-50 p-8 sm:p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-teal-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    alt="Naman"
                    className="w-20 h-20 rounded-2xl mr-4 ring-4 ring-teal-200 shadow-lg object-cover group-hover:ring-teal-400 transition-all duration-300 bg-teal-100"
                    src="/testimonals/Naman.jpeg" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-teal-700 transition-colors">Naman Singh</h3>
                  <p className="text-sm text-teal-600 font-semibold"> Dev</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[100px]">
              "Dedicated to pushing the boundaries of what's possible with local AI. Building tools that empower developers to create smarter, more intuitive applications prioritizing user privacy."
            </p>

            <div className="flex gap-3 pt-4 border-t border-teal-100">
              <a 
                href="https://github.com/Naman1005" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Arya Card */}
        <div className="group relative bg-gradient-to-br from-white to-blue-50 p-8 sm:p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    alt="Saurabh"
                    className="w-20 h-20 rounded-2xl mr-4 ring-4 ring-blue-200 shadow-lg object-cover group-hover:ring-blue-400 transition-all duration-300 bg-blue-100"
                    src="/testimonals/placeholder.png" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">Surabh Patil</h3>
                  <p className="text-sm text-blue-600 font-semibold"> Dev</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[100px]">
              "Exploring the intersection of secure local storage and artificial intelligence. Committed to creating transparent, user-owned solutions that redefine how we interact with AI."
            </p>

            <div className="flex gap-3 pt-4 border-t border-blue-100">
              <a 
                href="https://github.com/saurabhpatil93" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
