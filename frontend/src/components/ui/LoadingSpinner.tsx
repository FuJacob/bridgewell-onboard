import Image from "next/image";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6">
      <Image
        src="/favicon.png"
        className="rounded-full relative animate-pulse"
        alt="Bridgewell Financial Logo"
        width={100}
        height={100}
      />

      <p className="mt-5 text-xl text-gray-600 font-medium">{message}</p>
    </div>
  );
}
