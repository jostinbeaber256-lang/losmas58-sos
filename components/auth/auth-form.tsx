"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/";
  const [supabase] = useState(createClient);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const action = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/` : undefined
          }
        });

    if (action.error) {
      setError(action.error.message);
      setLoading(false);
      return;
    }

    if (!isLogin && !action.data.session) {
      setSuccess(
        "Registro creado. Revisa tu correo para confirmar la cuenta si Supabase tiene confirmacion por email activa."
      );
      setLoading(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <section className="panel-blur rounded-[2rem] p-5">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-accent">
          {isLogin ? "Acceso seguro" : "Crear cuenta"}
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          {isLogin ? "Inicia sesion" : "Unete a Los+58"}
        </h1>
        <p className="text-sm leading-6 text-muted">
          {isLogin
            ? "Accede para ver el mapa, las alertas activas y tu perfil motero."
            : "Registra tu cuenta para activar el modo ruta y el boton SOS de la comunidad."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
            placeholder="motero@los58.app"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Contrasena</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
            placeholder="Minimo 6 caracteres"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading
            ? "Procesando..."
            : isLogin
              ? "Iniciar sesion"
              : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted">
        {isLogin ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
        <Link
          href={isLogin ? "/registro" : "/login"}
          className="font-medium text-accent"
        >
          {isLogin ? "Registrate" : "Inicia sesion"}
        </Link>
      </p>
    </section>
  );
}
