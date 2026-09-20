import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <h1 className="text-headline text-center text-[2rem]">Entrar</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-accent hover:underline">
          Crear una
        </Link>
      </p>
    </div>
  );
}
