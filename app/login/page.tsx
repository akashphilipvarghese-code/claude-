"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@tradeix.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl mb-6" style={{ fontFamily: "Georgia, serif" }}>Sign in to Tradeix</h1>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="demo1234"
            className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-md bg-amber-600 text-black text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-gray-500">Demo account: demo@tradeix.com / demo1234</p>
      </form>
    </main>
  );
}
