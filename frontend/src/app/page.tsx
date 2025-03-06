import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Landing from "@/components/Landing";
export default function Home() {
  return (
    <>
      <Nav />
      <Landing />
      <Footer />
    </>
  );
}
