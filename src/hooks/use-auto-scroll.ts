"use client";

import { type RefObject, useEffect, useRef } from "react";

/** Velocidades de 1 a 10 → pixels por segundo. */
export function scrollSpeedToPxPerSecond(speed: number): number {
  return 8 + (speed - 1) * 9; // 8 px/s (lento) … 89 px/s (rápido)
}

/**
 * Rola um elemento (ou a janela, se `target` for null) continuamente enquanto `active`.
 * Chama `onEnd` ao chegar no fim.
 */
export function useAutoScroll({
  active,
  speed,
  target,
  onEnd,
}: {
  active: boolean;
  speed: number;
  target: RefObject<HTMLElement | null> | null;
  onEnd: () => void;
}) {
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!active) return;
    const pxPerSecond = scrollSpeedToPxPerSecond(speed);
    let last = performance.now();
    let carry = 0;
    let frame = 0;

    const tick = (now: number) => {
      const el = target?.current ?? null;
      carry += ((now - last) / 1000) * pxPerSecond;
      last = now;
      const step = Math.floor(carry);
      if (step >= 1) {
        carry -= step;
        if (el) el.scrollTop += step;
        else window.scrollBy(0, step);
      }
      const atEnd = el
        ? el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atEnd) {
        onEndRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, speed, target]);
}
