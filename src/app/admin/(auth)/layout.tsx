import { BrandMark } from "@/components/admin/BrandMark";

// Sign-in, password and access-denied screens: one narrow column on white.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-1 bg-tm-red" aria-hidden="true" />
      <header className="px-tm-gutter py-6">
        <div className="mx-auto max-w-tm-content">
          <BrandMark />
        </div>
      </header>
      <main className="flex-1 px-tm-gutter pb-16 pt-4 sm:pt-12">
        <div className="mx-auto w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}
