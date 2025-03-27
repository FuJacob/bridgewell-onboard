"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ClientLoginPage() {
    const [loginKey, setLoginKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Check for login key in URL parameters when component mounts
    useEffect(() => {
        const keyFromUrl = searchParams.get("key");
        if (keyFromUrl) {
            setLoginKey(keyFromUrl);
            // Option to auto-submit with the key from URL
            // handleSubmitWithKey(keyFromUrl);
        }
    }, [searchParams]);
    
    const handleSubmitWithKey = async (key: string) => {
        if (!key.trim()) {
            setError("Please enter a login key");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/client/validate-key?key=${encodeURIComponent(key)}`);
            const data = await response.json();

            if (response.ok && data.valid) {
                router.push(`/client/form/${key}`);
            } else {
                setError(data.error || "Invalid login key. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSubmitWithKey(loginKey);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-32 bg-gray-200 rounded-full px-4 py-2 mb-4 mx-auto">
                        <Link href="/">
                            <Image
                                src="/logo-bridgewell.png"
                                alt="Bridgewell Financial Logo"
                                width={100}
                                height={100}
                                layout="responsive"
                                className="cursor-pointer"
                            />
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-primary">Client Portal</h1>
                    <p className="mt-2 text-gray-600">Enter your login key to access your form</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="loginKey" className="block text-sm font-medium mb-1">
                                Login Key
                            </label>
                            <input
                                id="loginKey"
                                type="text"
                                value={loginKey}
                                onChange={(e) => setLoginKey(e.target.value)}
                                placeholder="Enter your login key"
                                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                                autoComplete="off"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm py-2">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-primary text-white py-3 px-4 rounded-xl font-bold transition 
                                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-DARK'}`}
                        >
                            {loading ? 'Verifying...' : 'Access Form'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
} 