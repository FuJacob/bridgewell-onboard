import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <>
      <nav className="mx-40 py-12 text-2xl font-bold space-x-12 flex justify-between">
        <Link href="/">
          <div className="w-40">
            <Image
              src="/logo-bridgewell.png"
              alt="Bridgewell Financial Logo"
              width={100}
              height={100}
              layout="responsive"
            />
          </div>
        </Link>
        <div className="space-x-12 flex justify-between">
          <Link href="/">Tutorial</Link>
          <Link href="/">Contact</Link>
          <a
            href="https://bridgewellfinancial.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Go to Bridgewell Website
          </a>
        </div>
        <div>
          <Link
            href="/"
            className="bg-primary rounded-full text-white px-8 py-4"
          >
            Get Started
          </Link>
        </div>
      </nav>
      <main className="mx-40 min-h-screen flex flex-row items-center justify-center">
        <div className="flex flex-col w-1/2">
          <div className="w-36 bg-gray-200 rounded-full px-4 py-2 mb-4">
            <Image
              src="/logo-bridgewell.png"
              alt="Bridgewell Financial Logo"
              width={100}
              height={100}
              layout="responsive"
            />
          </div>
          <h1 className="font-black text-6xl mb-2">Client Onboarding,</h1>
          <h1 className="font-black text-6xl mb-8">
            <span className="text-primary">Simplified</span> &{" "}
            <span className="text-secondary">Secure</span>
          </h1>
          <h2 className="w-2/3">
            MakeForms empowers teams to build advanced, visually stunning forms
            with top-notch security standards,now enhanced by AI capabilities.
          </h2>
          <div className="bg-primary rounded-2xl py-6 flex items-center justify-center mt-12 w-1/2">
            <form action="" className="flex flex-col items-center">
              <input
                className="border-secondary border-2 rounded-2xl px-24 py-4 w-full"
                type="text"
                placeholder="Enter in your PIN sent by your Bridgewell advisor"
              />
              <input
                type="submit"
                value="Enter Onboarding"
                className="mt-4 bg-secondary w-full text-white text-2xl font-black rounded-2xl py-6"
              />
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/2">
          <div className="bg-primary px-96 py-80 rounded-3xl" />
        </div>
      </main>
      <div className="mx-40 flex flex-col text-center items-center justify-center space-y-12">
        <div className="w-2/3">
          <h1 className="font-black text-5xl mb-8">
            Your “next steps” email makes buyers drag their feet.
          </h1>
          <div className="flex flex-row gap-12">
            <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center w-1/2">
              <h1 className="text-5xl">😀</h1>
              <p>
                Prospects get lost in complex follow-up emails full of links and
                attachments.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center w-1/2">
              <h1 className="text-5xl">😀</h1>
              <p>
                Prospects get lost in complex follow-up emails full of links and
                attachments.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center w-1/2">
              <h1 className="text-5xl">😀</h1>
              <p>
                Prospects get lost in complex follow-up emails full of links and
                attachments.
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer className="my-12 text-white rounded-3xl mx-32 p-12 text-2xl font-bold space-x-12 flex flex-row bg-primary justify-between h-96">
        <div className="flex flex-col items-center justify-center">
          <a>Arrows Pricing</a> <a>Arrows Pricing</a> <a>Arrows Pricing</a>{" "}
          <a>Arrows Pricing</a>
        </div>

        <div className="flex flex-col items-center justify-center">
          <a>Arrows Pricing</a> <a>Arrows Pricing</a> <a>Arrows Pricing</a>{" "}
          <a>Arrows Pricing</a> <a>Arrows Pricing</a>
        </div>

        <div className="flex flex-col items-center justify-center">
          <a>Arrows Pricing</a>
          <a>Arrows Pricing</a>
          <a>Arrows Pricing</a>
          <a>Arrows Pricing</a>
        </div>
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-6xl">Having issues?</h1>
          <Link
            href="/"
            className="bg-secondary rounded-full text-white px-8 py-4"
          >
            Contact Bridgewell
          </Link>
        </div>
      </footer>
    </>
  );
}
