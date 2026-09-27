"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppRoutes } from "@/lib/app-routes";

import { CoinIcon, FlameIcon, SentencesIcon } from "./icons";
import { CelebrateScene } from "./scenes";
import { useStudio } from "./studio-provider";
import { PrimaryButton } from "./ui";

export function SuccessScreen({ claim }: { claim: string | null }) {
  const { claimReward } = useStudio();
  const router = useRouter();

  useEffect(() => {
    if (claim) claimReward(claim);
  }, [claim, claimReward]);

  return (
    <div className="flex min-h-full items-center justify-center py-6">
      <section className="w-full max-w-[520px] rounded-[32px] bg-white px-6 py-10 text-center shadow-[0_16px_40px_rgba(40,80,50,0.08)] sm:px-10">
        <CelebrateScene />
        <h1 className="text-4xl font-extrabold tracking-tight">Great job!</h1>
        <p className="mt-2 font-semibold text-sen-muted">You finished this lesson</p>
        <ul className="mt-6 grid grid-cols-3 gap-3">
          <Reward
            icon={<FlameIcon className="mx-auto h-6 w-6 text-sen-flame" />}
            value="+1"
            label="Day streak"
            className="bg-[#fff6ea]"
          />
          <Reward
            icon={<CoinIcon className="mx-auto h-6 w-6 text-sen-primary" />}
            value="+10"
            label="points"
            className="bg-[#eef8f0]"
          />
          <Reward
            icon={<SentencesIcon className="mx-auto h-6 w-6 text-[#3d93e8]" />}
            value="+3"
            label="sentences"
            className="bg-[#eef4ff]"
          />
        </ul>
        <PrimaryButton className="mt-8 w-full" onClick={() => router.push(AppRoutes.home)}>
          Continue
        </PrimaryButton>
      </section>
    </div>
  );
}

function Reward({
  icon,
  value,
  label,
  className,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  className: string;
}) {
  return (
    <li className={`rounded-2xl px-2 py-3 ${className}`}>
      {icon}
      <p className="mt-1 font-extrabold">{value}</p>
      <p className="text-[11px] font-bold text-sen-muted">{label}</p>
    </li>
  );
}
