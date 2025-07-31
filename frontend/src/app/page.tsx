import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Landing from "@/components/pages/Landing";
export default function Home() {
  return (
    <>
      {/* This site is under maintenance.
      We hope to bring you a bug-free experience soon. 
      Please email Jordan if you have any questions. Hopefully we can have it out August 4th, 2025.
      Thank you for your patience. */}
      <Nav />
      <Landing />
      <Footer />
    </>
  );
}