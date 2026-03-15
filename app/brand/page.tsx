import AppHeader, { LogoStatic, BackToAppLink } from "@/components/AppHeader";
import BrandGuidelines from "@/components/BrandGuidelines";

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-brand-bg">

      <AppHeader logoSlot={<LogoStatic />} rightSlot={<BackToAppLink />} />

      <main className="max-w-4xl mx-auto px-6 py-14">
        <BrandGuidelines />
      </main>

    </div>
  );
}
