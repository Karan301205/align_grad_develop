import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const AnimatedContent = ({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  // Stagger the direct children in sequence instead of animating this element as one block.
  stagger = 0,
  // Tie this element's position to scroll progress for a parallax drift (independent of the reveal).
  parallax = false,
  parallaxStrength = 60,
  onComplete,
  onDisappearanceComplete,
  className = '',
  ...props
}) => {
  const ref = useRef(null);

  useEffect(() => {
    // Register plugin safely in browser-only lifecycle hook
    gsap.registerPlugin(ScrollTrigger);

    const el = ref.current;
    if (!el) return;

    let scrollerTarget = container || document.getElementById('snap-main-container') || null;

    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    const targets = stagger > 0 ? Array.from(el.children) : el;

    gsap.set(targets, {
      [axis]: offset,
      scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: 'visible'
    });
    gsap.set(el, { visibility: 'visible' });

    const tl = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        if (onComplete) onComplete();
        if (disappearAfter > 0) {
          gsap.to(targets, {
            [axis]: reverse ? distance : -distance,
            scale: 0.8,
            opacity: animateOpacity ? initialOpacity : 0,
            delay: disappearAfter,
            duration: disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.()
          });
        }
      }
    });

    tl.to(targets, {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration,
      ease,
      stagger: stagger > 0 ? stagger : 0
    });

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play()
    });

    let parallaxTween;
    let parallaxST;
    if (parallax) {
      parallaxTween = gsap.fromTo(
        el,
        { [axis]: -parallaxStrength },
        { [axis]: parallaxStrength, ease: 'none' }
      );
      parallaxST = ScrollTrigger.create({
        trigger: el,
        scroller: scrollerTarget,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        animation: parallaxTween
      });
    }

    return () => {
      if (st) st.kill();
      if (tl) tl.kill();
      if (parallaxST) parallaxST.kill();
      if (parallaxTween) parallaxTween.kill();
    };
  }, [
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    stagger,
    parallax,
    parallaxStrength,
    onComplete,
    onDisappearanceComplete
  ]);

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }} {...props}>
      {children}
    </div>
  );
};

export default AnimatedContent;
