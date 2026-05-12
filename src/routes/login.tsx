import { useState } from "react";
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  if (loading) return null;
  if (session) return <Navigate to="/scribe" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/scribe" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/login",
      });
      if (error) throw error;
      toast.success("If an account exists, a reset link was sent.");
      setResetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="size-16 grid place-items-center rounded-2xl bg-white/15 backdrop-blur mb-6">
          <Stethoscope className="size-8" />
        </div>
        <h1 className="text-3xl font-display font-bold text-center">Medical Scribe Generator</h1>
        <p className="mt-2 text-white/80 text-center max-w-xs text-sm">
          Specialised clinical documentation, on a single platform — accessible anywhere.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 w-full max-w-sm bg-card text-card-foreground rounded-3xl p-6 shadow-elevated space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary">
            {busy ? "Please wait…" : mode === "signin" ? "Login" : "Create account"}
          </Button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Create account" : "Have an account? Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetOpen(true);
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Reset password
            </button>
          </div>
        </form>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Give in your email address, we send a temporary password / reset link.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button onClick={sendReset} className="w-full bg-gradient-primary">
            Send reset link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
