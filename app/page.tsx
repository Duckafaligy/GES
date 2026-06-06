import Navigation from "@/components/Navigation";
import VideoHero from "@/components/VideoHero";
import BikeShowcase from "@/components/BikeShowcase";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import ThreeDFeatures from "@/components/ThreeDFeatures";
import Process from "@/components/Process";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <VideoHero />
        <BikeShowcase />
        <Services />
        <Pricing />
        <ThreeDFeatures />
        <Process />
        <Stats />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
