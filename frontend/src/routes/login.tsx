import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, LineChart, Package } from "lucide-react";

import { EmailAuthCard } from "@/features/auth/components/email-auth-card";
import { GoogleSignInCard } from "@/features/auth/components/google-sign-in-card";

const HIGHLIGHTS = [
  { icon: Package, text: "Lacak setiap barang — HP, mobil, apa saja." },
  { icon: CreditCard, text: "Tunai atau cicil syariah dengan jadwal cicilan otomatis." },
  { icon: LineChart, text: "Wawasan langsung pendapatan, laba & sisa cicil." },
];

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-accent-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60rem 40rem at 110% -10%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(40rem 30rem at -10% 120%, rgba(255,255,255,0.3), transparent 55%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white/20 font-display text-lg font-bold backdrop-blur">
            b
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">barangsecond</span>
        </div>
        <div className="relative space-y-8">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Stok bekas,
            <br />
            penjualan & cicil —
            <br />
            dalam satu buku besar.
          </h1>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-sm text-accent-foreground/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/15 backdrop-blur">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-accent-foreground/70">barangsecond.com</p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="reveal flex w-full max-w-sm flex-col gap-5">
          <div className="space-y-1 lg:hidden">
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              barangsecond
            </span>
            <p className="text-sm text-muted-foreground">Pelacak inventaris, penjualan & cicil.</p>
          </div>
          <EmailAuthCard />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ATAU
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInCard />
        </div>
      </div>
    </div>
  );
}
