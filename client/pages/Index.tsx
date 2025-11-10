import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from "firebase/auth";
import { toast } from "sonner";

export default function Index() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [key, setKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const title = useMemo(() => (mode === "login" ? "Se connecter" : "Créer un compte"), [mode]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Connecté");
        navigate("/dashboard");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try { await sendEmailVerification(cred.user); } catch {}
        toast.success("Compte créé. Vérifiez votre email.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur d'authentification");
    }
  }

  async function activateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous d'abord");
    const token = await user.getIdToken();
    const res = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      toast.success("Licence activée");
      setKey("");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || "Activation échouée");
    }
  }

  async function startLinkRoblox() {
    if (!user) return toast.error("Connectez-vous d'abord");
    const token = await user.getIdToken();
    const res = await fetch("/api/roblox/link/start", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Code de liaison: ${data.code}`);
    } else {
      toast.error(data?.error || "Impossible de générer le code");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] to-[#0a0f1a] text-white">
      <header className="border-b border-border/50 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src="/logo-rshield.svg" className="h-8 w-8" alt="RShield" />
            <span className="font-extrabold tracking-tight text-xl">RShield — Panel</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a className="text-primary hover:underline" href="https://discord.gg/" target="_blank" rel="noreferrer">Discord</a>
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
                <button onClick={() => signOut(auth)} className="px-3 py-1 rounded-md bg-muted hover:bg-accent">Logout</button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="container grid lg:grid-cols-2 gap-10 py-12">
        <section className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent/30 px-3 py-1 text-xs text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/> AntiCheat + Licences + Roblox Link
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Sécurisez vos serveurs Roblox avec <span className="text-primary">RShield</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Authentification Firebase, vérification de licence, console de commandes, bans, logs en temps réel et intégration Roblox clé-en-main.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={user ? "/dashboard" : "#auth"} className="px-5 py-2.5 rounded-lg bg-primary text-black font-semibold shadow-[0_0_30px_rgba(14,165,255,0.35)] hover:shadow-[0_0_40px_rgba(14,165,255,0.55)] transition">{user ? "Ouvrir le Dashboard" : "Commencer"}</Link>
            <a href="https://discord.gg/" className="px-5 py-2.5 rounded-lg border border-border hover:border-primary/60 transition">Pas de clé ? Contact Discord</a>
          </div>
          <ul className="mt-8 text-sm text-muted-foreground grid grid-cols-2 gap-2 max-w-lg">
            <li>• Licences et partage via lien + mot de passe</li>
            <li>• Bans temporaires et permanents</li>
            <li>• Console commandes globale</li>
            <li>• Roblox account linking par code</li>
          </ul>
        </section>

        <section id="auth" className="">
          <div className="bg-card/80 backdrop-blur rounded-2xl border border-border/60 p-6 shadow-2xl">
            <div className="flex gap-1 mb-6">
              <button onClick={() => setMode("login")} className={cn("flex-1 py-2 rounded-md", mode === "login" ? "bg-primary text-black" : "bg-muted hover:bg-accent")}>Login</button>
              <button onClick={() => setMode("register")} className={cn("flex-1 py-2 rounded-md", mode === "register" ? "bg-primary text-black" : "bg-muted hover:bg-accent")}>Register</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="text-sm">Email</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm">Mot de passe</label>
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button type="submit" className="w-full py-2 rounded-md bg-primary text-black font-semibold">{title}</button>
            </form>
            <div className="my-6 h-px bg-border" />
            <form onSubmit={activateKey} className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm">Activer une clé</label>
                  <input value={key} onChange={(e)=>setKey(e.target.value)} placeholder="ABCD-XXXX-YYYY" className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button className="px-4 py-2 rounded-md bg-secondary text-black font-semibold">Activer</button>
              </div>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button onClick={startLinkRoblox} className="underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">Lier mon compte Roblox</button>
              {user ? <span className="text-muted-foreground">Connecté: {user.email}</span> : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} RShield</span>
          <div className="flex items-center gap-3">
            <a href="/scripts/roblox/TerminalSecureRShield.lua" className="hover:text-primary">Script Roblox</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary">Docs & README</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
