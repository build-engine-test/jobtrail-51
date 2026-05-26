import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in · JobTrail",
  description: "Sign in to your JobTrail account.",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <SignInForm />
    </main>
  );
}
