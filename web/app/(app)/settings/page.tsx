import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <SettingsForm />
    </div>
  );
}
