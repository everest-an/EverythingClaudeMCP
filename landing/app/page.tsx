import Nav from "../components/Nav";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Tools from "../components/Tools";
import Examples from "../components/Examples";
import QuickStart from "../components/QuickStart";
import Footer from "../components/Footer";
import Aurora from "../components/Aurora";
import MouseSpotlight from "../components/MouseSpotlight";

function SectionDivider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="section-divider" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Aurora />
      <MouseSpotlight />
      <Nav />
      <main>
        <Hero />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <Tools />
        <SectionDivider />
        <Examples />
        <SectionDivider />
        <QuickStart />
      </main>
      <Footer />
    </>
  );
}
