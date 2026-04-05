import AppHeader, { LogoStatic, BackToAppLink } from "@/components/AppHeader";
import BrandGuidelines from "@/components/BrandGuidelines";

export default function BrandPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #EDEDF3 100%)" }}>

      <AppHeader light logoSlot={<LogoStatic light />} rightSlot={<BackToAppLink light />} />

      <main className="max-w-4xl mx-auto px-6 py-14">
        <BrandGuidelines />
      </main>

    </div>
  );
}
