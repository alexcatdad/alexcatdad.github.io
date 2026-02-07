import { useEffect, useRef, useState } from 'react';

export function useCountUp(end: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !isInView || hasAnimated.current) return;

    hasAnimated.current = true;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (easeOutExpo)
      const easeOut = 1 - 2 ** (-10 * progress);
      const currentCount = startValue + (end - startValue) * easeOut;

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, enabled, isInView]);

  return { count, ref };
}
