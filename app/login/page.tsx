import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="space-y-6">
      <AuthForm mode="login" />
    </main>
  );
}
