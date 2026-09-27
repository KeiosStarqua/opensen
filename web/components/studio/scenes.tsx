import type { StudioStep } from "@/lib/studio/content";

function SceneImage({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={className ?? "h-full w-full object-cover"} />;
}

export function HomeLandscape() {
  return (
    <SceneImage
      src="/studio/home-hero.png"
      className="h-full w-full object-cover object-[center_58%]"
    />
  );
}

export function AirportScene() {
  return (
    <SceneImage
      src="/studio/airport-hero.png"
      className="h-full w-full object-cover object-[center_52%]"
    />
  );
}

export function CheckInScene({ className }: { className?: string }) {
  return <SceneImage src="/studio/check-in.png" className={className ?? "h-full w-full object-cover"} />;
}

export function AskHelpScene({ className }: { className?: string }) {
  return <SceneImage src="/studio/ask-help.png" className={className ?? "h-full w-full object-cover"} />;
}

const stepArt: Record<StudioStep["art"], string> = {
  counter: "/studio/check-in.png",
  help: "/studio/ask-help.png",
  bag: "/studio/step-baggage.png",
  security: "/studio/step-security.png",
  gate: "/studio/step-boarding.png",
  table: "/studio/step-table.png",
  menu: "/studio/step-menu.png",
  pay: "/studio/step-pay.png",
  shop: "/studio/step-shop.png",
  town: "/studio/step-town.png",
  class: "/studio/step-class.png",
};

export function StepArt({ art }: { art: StudioStep["art"] }) {
  return <SceneImage src={stepArt[art]} />;
}

const topicBanner: Record<string, string> = {
  travel: "/studio/airport-hero.png",
  restaurant: "/studio/step-table.png",
  shopping: "/studio/step-shop.png",
  daily: "/studio/step-town.png",
  school: "/studio/step-class.png",
};

export function TopicBanner({ topicId }: { topicId: string }) {
  return (
    <SceneImage
      src={topicBanner[topicId] ?? "/studio/home-hero.png"}
      className="h-full w-full object-cover object-[center_55%]"
    />
  );
}

export function CelebrateScene() {
  return (
    <img src="/studio/celebrate.png" alt="" className="mx-auto h-44 w-44 rounded-[28px] object-cover" />
  );
}

export function SpeakScene() {
  return <img src="/studio/speak.png" alt="" className="mx-auto h-40 w-40 rounded-[28px] object-cover" />;
}

export function SenMark({ className }: { className?: string }) {
  return (
    <img
      src="/studio/sen-bust.png"
      alt=""
      className={className ?? "h-14 w-14 shrink-0 rounded-full object-cover object-[center_30%]"}
    />
  );
}
