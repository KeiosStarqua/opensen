import { useRef, useState } from "react";

import { usePrimaryCta } from "@/lib/use-primary-cta";

export type SpotlightSlide = {
  image: string;
  alt: string;
  line: string;
  title: string;
  detail: string;
};

export function MobileSpotlight({ slides }: { slides: SpotlightSlide[] }) {
  const cta = usePrimaryCta();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollLeftFor(index: number) {
    const el = scroller.current;
    const card = el?.children.item(index);
    if (!el || !(card instanceof HTMLElement)) return 0;
    return Math.max(0, card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2);
  }

  function syncActive() {
    const el = scroller.current;
    if (!el) return;
    let closest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let index = 0; index < slides.length; index += 1) {
      const distance = Math.abs(el.scrollLeft - scrollLeftFor(index));
      if (distance < best) {
        best = distance;
        closest = index;
      }
    }
    setActive(closest);
  }

  function goTo(index: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: scrollLeftFor(index), behavior: "smooth" });
    setActive(index);
  }

  return (
    <div id="spotlight">
      <div
        ref={scroller}
        onScroll={syncActive}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <a
            key={slide.title}
            href={cta.href}
            className="flex w-[calc(100%-0.25rem)] shrink-0 snap-center items-center gap-3 rounded-[24px] bg-white p-2.5 shadow-[0_10px_28px_rgba(23,48,40,0.08)]"
          >
            <div className="relative h-[92px] w-[118px] shrink-0 overflow-hidden rounded-[18px] bg-[#fff6ea]">
              <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover" />
              <p className="absolute left-1.5 top-1.5 max-w-[92%] rounded-xl rounded-bl-sm bg-white px-2 py-1 text-[10px] font-extrabold leading-tight text-[#173028] shadow-sm">
                {slide.line}
              </p>
              <span
                className="absolute bottom-1.5 left-1/2 inline-flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#178a45] text-white shadow-md"
                aria-hidden
              >
                <PlayIcon />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold leading-tight tracking-tight text-[#173028]">
                {slide.title}
              </h2>
              <p className="mt-1 text-xs leading-4 text-[#5e6f68]">{slide.detail}</p>
            </div>
            <Chevron className="h-4 w-4 shrink-0 text-[#8aa094]" />
          </a>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Lesson previews">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={slide.title}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-4 bg-[#178a45]" : "w-1.5 bg-[#c5d9cc]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ml-0.5 h-3.5 w-3.5" aria-hidden>
      <path d="M7 5.2v9.6l8-4.8-8-4.8Z" fill="currentColor" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
