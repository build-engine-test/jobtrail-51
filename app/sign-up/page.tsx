import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up · JobTrail",
  description: "Create your JobTrail account.",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <SignUpForm />
    </main>
  );
}
