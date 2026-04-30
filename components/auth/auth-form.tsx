"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRightIcon,
  EnvelopeIcon,
  EyeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserPlusIcon
} from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "register";
type SocialProvider = "google" | "facebook";

function getSafeRedirectTo(value: string | null): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value as Route;
}

function getModeHref(mode: AuthMode, redirectTo: Route): Route {
  const path = mode === "login" ? "/login" : "/registro";

  if (redirectTo === "/") {
    return path as Route;
  }

  return `${path}?next=${encodeURIComponent(redirectTo)}` as Route;
}

function GoogleMark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xl font-black text-[#4285F4]">
      G
    </span>
  );
}

function FacebookMark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1877F2] text-xl font-black text-white">
      f
    </span>
  );
}

function waitForSessionCookie() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 180);
  });
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(searchParams.get("next"));
  const [supabase] = useState(createClient);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const authError = searchParams.get("error");

  const isLogin = mode === "login";

  async function navigateAfterAuth(target: Route) {
    setSuccess("Acceso confirmado. Cargando tu panel Los+58...");
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || "No se pudo verificar el usuario autenticado.");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      await waitForSessionCookie();
      window.location.replace(target);
      return;
    }

    router.replace(target);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();
    const action = isLogin
      ? await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })
      : await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}${redirectTo}`
                : undefined
          }
        });

    if (action.error) {
      setError(action.error.message);
      setLoading(false);
      return;
    }

    if (!isLogin && !action.data.session) {
      setSuccess(
        "Cuenta creada. Revisa tu correo para confirmar el acceso si Supabase tiene confirmacion activa."
      );
      setLoading(false);
      return;
    }

    await navigateAfterAuth(redirectTo);
  }

  async function handleSocialLogin(provider: SocialProvider) {
    setError(null);
    setSuccess(null);
    setSocialLoading(provider);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", redirectTo);
    const { error: socialError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString()
      }
    });

    if (socialError) {
      setError(socialError.message);
      setSocialLoading(null);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Escribe tu correo electronico para enviarte la recuperacion.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${origin}/login`
      }
    );

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess("Te enviamos un enlace para recuperar tu contrasena.");
  }

  return (
    <section className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-5xl items-center justify-center overflow-hidden border-y border-white/10 bg-[radial-gradient(circle_at_12%_45%,rgba(32,211,238,0.22),transparent_28%),radial-gradient(circle_at_92%_62%,rgba(255,77,109,0.24),transparent_28%),linear-gradient(180deg,rgba(3,10,26,1),rgba(2,6,17,1))] px-4 py-8 shadow-[0_30px_110px_rgba(0,0,0,0.5)] sm:rounded-[2.5rem] sm:border sm:px-6 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(32,211,238,0.06)_22%,transparent_43%,rgba(255,77,109,0.06)_74%,transparent_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-danger/16 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[760px]">
        <div className="mx-auto grid grid-cols-2 overflow-hidden rounded-full border border-white/20 bg-[rgba(8,16,34,0.72)] shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <Link
            href={getModeHref("login", redirectTo)}
            className={`flex min-h-16 items-center justify-center gap-3 px-4 text-base font-bold transition sm:text-xl ${
              isLogin
                ? "bg-[linear-gradient(90deg,rgba(32,211,238,0.18),rgba(32,211,238,0.05))] text-accent shadow-[inset_0_-3px_0_#20d3ee,0_18px_36px_rgba(32,211,238,0.18)]"
                : "text-muted hover:text-ink"
            }`}
          >
            <UserCircleIcon className="h-6 w-6" />
            Iniciar sesion
          </Link>
          <Link
            href={getModeHref("register", redirectTo)}
            className={`flex min-h-16 items-center justify-center gap-3 px-4 text-base font-bold transition sm:text-xl ${
              !isLogin
                ? "bg-[linear-gradient(90deg,rgba(255,77,109,0.16),rgba(255,77,109,0.05))] text-danger shadow-[inset_0_-3px_0_#ff4d6d,0_18px_36px_rgba(255,77,109,0.16)]"
                : "text-muted hover:text-ink"
            }`}
          >
            <UserPlusIcon className="h-6 w-6" />
            Registrarse
          </Link>
        </div>

        <div className="mt-5 text-center">
          <Image
            src="/logo-los58-transparent.png"
            alt="Logo Los+58"
            width={520}
            height={520}
            priority
            className="mx-auto w-[min(82vw,520px)] drop-shadow-[0_32px_70px_rgba(0,0,0,0.6)]"
          />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl">
            Bienvenido a{" "}
            <span className="bg-gradient-to-r from-accent to-[#00e5a8] bg-clip-text text-transparent">
              Los+58
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-7 text-muted sm:text-xl">
            Tu seguridad. Tu ruta. Siempre conectados.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-[640px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="sr-only">Correo electronico o usuario</span>
              <div className="flex min-h-20 items-center gap-4 rounded-[1.6rem] border border-accent/45 bg-[rgba(10,19,39,0.72)] px-5 text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition focus-within:border-accent focus-within:shadow-[0_0_34px_rgba(32,211,238,0.16)]">
                <EnvelopeIcon className="h-7 w-7 shrink-0 text-accent" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-muted/70 sm:text-lg"
                  placeholder="Correo electronico o usuario"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Contrasena</span>
              <div className="flex min-h-20 items-center gap-4 rounded-[1.6rem] border border-danger/45 bg-[rgba(10,19,39,0.72)] px-5 text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition focus-within:border-danger focus-within:shadow-[0_0_34px_rgba(255,77,109,0.14)]">
                <LockClosedIcon className="h-7 w-7 shrink-0 text-danger" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-muted/70 sm:text-lg"
                  placeholder="Contrasena"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <EyeIcon className="h-7 w-7 shrink-0 text-muted/70" />
              </div>
            </label>

            <div className="flex justify-end text-sm">
              <button
                type="button"
                onClick={() => void handlePasswordReset()}
                className="font-semibold text-accent transition hover:text-ink"
              >
                ¿Olvidaste tu contrasena?
              </button>
            </div>

            {error || authError ? (
              <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error || authError}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || Boolean(socialLoading)}
              className="group mt-6 flex min-h-20 w-full items-center justify-center rounded-full bg-[linear-gradient(100deg,#12e1d2_0%,#20d3ee_44%,#ff4d7d_100%)] px-5 text-xl font-black text-background shadow-[0_24px_70px_rgba(32,211,238,0.26),0_18px_60px_rgba(255,77,109,0.18)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-2xl"
            >
              <span className="flex-1 text-center">
                {loading
                  ? "Procesando..."
                  : isLogin
                    ? "Iniciar sesion"
                    : "Registrarse"}
              </span>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-background/90 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                <ArrowRightIcon className="h-7 w-7 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          </form>

          <div className="relative my-6 flex items-center gap-5">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-base font-medium text-muted">O continua con</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => void handleSocialLogin("google")}
              disabled={loading || Boolean(socialLoading)}
              className="grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.4rem] border border-accent/35 bg-[rgba(10,19,39,0.72)] px-5 text-base font-bold text-ink transition hover:border-accent hover:bg-accent/8 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
            >
              <GoogleMark />
              <span>
                {socialLoading === "google"
                  ? "Conectando con Google..."
                  : "Continuar con Google"}
              </span>
              <span />
            </button>
            <button
              type="button"
              onClick={() => void handleSocialLogin("facebook")}
              disabled={loading || Boolean(socialLoading)}
              className="grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.4rem] border border-[#1877F2]/45 bg-[rgba(10,19,39,0.72)] px-5 text-base font-bold text-ink transition hover:border-[#1877F2] hover:bg-[#1877F2]/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
            >
              <FacebookMark />
              <span>
                {socialLoading === "facebook"
                  ? "Conectando con Facebook..."
                  : "Continuar con Facebook"}
              </span>
              <span />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
            <p className="text-left text-sm leading-6 text-muted sm:text-base">
              Tus datos estan protegidos
              <br />
              Seguridad en cada kilometro
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
