import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Team from '@/components/sections/Team';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Team />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}




