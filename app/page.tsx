import Navigation from "@/components/Navigation";
import CustomCursor from "@/components/CustomCursor";
import BookCall from "@/components/BookCall";
import ScrollProgress from "@/components/ScrollProgress";
import VideoHero from "@/components/VideoHero";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import ThreeDFeatures from "@/components/ThreeDFeatures";
import Process from "@/components/Process";
import Work from "@/components/Work";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <BookCall />
      <Navigation />
      <main>
        <VideoHero />
        <Services />
        <Pricing />
        <ThreeDFeatures />
        <Work />
        <Process />
        <Contact />
        <BookCall inline />
      </main>
      <Footer />
    </>
  );
}
