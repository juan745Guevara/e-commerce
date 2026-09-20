import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-serif text-4xl">Entrar</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-ink/70">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="underline">
          Crear una
        </Link>
      </p>
    </div>
  );
}
