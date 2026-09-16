"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Full-viewport "curtain" sweep between routes, ported from a multi-page
// site's real-page-load version (see the portfolio project this is drawn
// from) to Next.js client-side navigation. Same left-to-right sweep in two
// halves: a click covers the viewport, the route swaps underneath, then the
// curtain continues rightward off-screen — revealing the new page — before
// parking off-screen-left again, ready for next time.
//
// Deliberately intercepts plain <a> clicks at the document level rather than
// wrapping next/link's <Link>: Link's own onClick would race this one to
// call preventDefault/navigate first, so every internal link in this app is
// a plain <a href> and lets this own the whole navigation.
const FALLBACK_MS = 1050;

export function PageCurtain() {
  const pathname = usePathname();
  const router = useRouter();
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const exitingRef = useRef(false);
  const prevPathRef = useRef(pathname);
  const reducedMotionRef = useRef(false);

  // Initial mount: the curtain starts covering the screen (the CSS default),
  // so reveal it once to show the first page.
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const curtain = curtainRef.current;
    if (!curtain || reducedMotionRef.current) {
      readyRef.current = true;
      return;
    }

    function forceReflow() {
      return curtain!.offsetHeight;
    }
    function park() {
      curtain!.classList.remove("is-animating", "is-revealed");
      forceReflow();
      curtain!.classList.add("is-parked");
      forceReflow();
      readyRef.current = true;
    }
    function reveal() {
      curtain!.classList.add("is-animating");
      forceReflow();
      curtain!.classList.add("is-revealed");
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        park();
      };
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== curtain || e.propertyName !== "transform") return;
        curtain!.removeEventListener("transitionend", onEnd);
        finish();
      };
      curtain!.addEventListener("transitionend", onEnd);
      setTimeout(finish, FALLBACK_MS + 100);
    }

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      reveal();
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(start));
    const fallback = setTimeout(start, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, []);

  // A route change completed (the click handler below already covered the
  // viewport and called router.push) — sweep the curtain on off-screen,
  // revealing the new page underneath.
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    const curtain = curtainRef.current;
    if (!curtain || reducedMotionRef.current) return;

    function forceReflow() {
      return curtain!.offsetHeight;
    }
    function park() {
      curtain!.classList.remove("is-animating", "is-revealed");
      forceReflow();
      curtain!.classList.add("is-parked");
      forceReflow();
    }

    curtain.classList.add("is-animating");
    forceReflow();
    curtain.classList.add("is-revealed");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      exitingRef.current = false;
      park();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== curtain || e.propertyName !== "transform") return;
      curtain.removeEventListener("transitionend", onEnd);
      finish();
    };
    curtain.addEventListener("transitionend", onEnd);
    setTimeout(finish, FALLBACK_MS + 100);
  }, [pathname]);

  // Own every internal link click: cover the viewport, then push the route.
  useEffect(() => {
    if (reducedMotionRef.current) return;

    function coverAndGo(href: string) {
      const curtain = curtainRef.current;
      if (!curtain) return;
      exitingRef.current = true;
      curtain.classList.add("is-animating");
      void curtain.offsetHeight; // force reflow so the class change above animates
      curtain.classList.remove("is-parked");

      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        router.push(href);
      };
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== curtain || e.propertyName !== "transform") return;
        curtain.removeEventListener("transitionend", onEnd);
        go();
      };
      curtain.addEventListener("transitionend", onEnd);
      setTimeout(go, FALLBACK_MS);
    }

    function onClick(e: MouseEvent) {
      if (!readyRef.current || exitingRef.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const rawHref = link.getAttribute("href") || "";
      const isSamePath = url.pathname === window.location.pathname && url.search === window.location.search;
      if (rawHref === "#" || (url.hash !== "" && isSamePath) || (isSamePath && url.hash === "")) return;

      e.preventDefault();
      coverAndGo(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return (
    <div ref={curtainRef} className="page-curtain" aria-hidden="true">
      <span className="curtain-mark">
        Portal<span style={{ color: "var(--brass)" }}>.</span>
      </span>
    </div>
  );
}
