import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveData } from "@/components/LiveData";
import { Sectors } from "@/components/Sectors";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
      <Navbar />

      <div className="relative z-10">
        <Hero />
        <LiveData />
        <Sectors />
      </div>

      <Footer />
    </main>
  );
}
