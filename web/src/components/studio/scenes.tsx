import type { StudioStep } from "@/lib/studio/content";

function SceneImage({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={className ?? "h-full w-full object-cover"} />;
}

export function HomeLandscape() {
  return (
    <SceneImage
      src="/studio/home-hero.jpg"
      className="h-full w-full object-cover object-[center_58%]"
    />
  );
}

export function AirportScene() {
  return (
    <SceneImage
      src="/studio/airport-hero.jpg"
      className="h-full w-full object-cover object-[center_52%]"
    />
  );
}

export function CheckInScene({ className }: { className?: string }) {
  return <SceneImage src="/studio/check-in.jpg" className={className ?? "h-full w-full object-cover"} />;
}

export function AskHelpScene({ className }: { className?: string }) {
  return <SceneImage src="/studio/ask-help.jpg" className={className ?? "h-full w-full object-cover"} />;
}

const stepArt: Record<StudioStep["art"], string> = {
  counter: "/studio/check-in.jpg",
  help: "/studio/ask-help.jpg",
  bag: "/studio/step-baggage.jpg",
  security: "/studio/step-security.jpg",
  gate: "/studio/step-boarding.jpg",
  table: "/studio/step-table.jpg",
  menu: "/studio/step-menu.jpg",
  pay: "/studio/step-pay.jpg",
  shop: "/studio/step-shop.jpg",
  town: "/studio/step-town.jpg",
  class: "/studio/step-class.jpg",
};

export function StepArt({ art }: { art: StudioStep["art"] }) {
  return <SceneImage src={stepArt[art]} />;
}

const topicBanner: Record<string, string> = {
  travel: "/studio/airport-hero.jpg",
  restaurant: "/studio/step-table.jpg",
  shopping: "/studio/step-shop.jpg",
  daily: "/studio/step-town.jpg",
  school: "/studio/step-class.jpg",
};

export function TopicBanner({ topicId }: { topicId: string }) {
  return (
    <SceneImage
      src={topicBanner[topicId] ?? "/studio/home-hero.jpg"}
      className="h-full w-full object-cover object-[center_55%]"
    />
  );
}

export function CelebrateScene() {
  return (
    <img src="/studio/celebrate.jpg" alt="" className="mx-auto h-44 w-44 rounded-[28px] object-cover" />
  );
}

export function SpeakScene() {
  return <img src="/studio/speak.jpg" alt="" className="mx-auto h-40 w-40 rounded-[28px] object-cover" />;
}

export function SenMark({ className }: { className?: string }) {
  return (
    <img
      src="/studio/sen-bust.jpg"
      alt=""
      className={className ?? "h-14 w-14 shrink-0 rounded-full object-cover object-[center_30%]"}
    />
  );
}
