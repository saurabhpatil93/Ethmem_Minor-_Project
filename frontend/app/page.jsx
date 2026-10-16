import { cn } from "../lib/cn";
import Header from "./components/Header.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Pricing from "./components/Pricing.jsx";
import Testimonials from "./components/Testimonials.jsx";

import FAQ from "./components/FAQ.jsx";

export default function Home() {
  return (
    <div
      className={cn("min-h-screen flex flex-col items-stretch justify-start px-0 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 lg:space-y-16")}
      style={{ backgroundColor: "#F9FAFC", color: "#101828" }}
    >
      <Header />
      <main className="space-y-8 sm:space-y-12 lg:space-y-16">
        <HowItWorks />

        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
    </div>
  );
}
