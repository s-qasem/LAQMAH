import { getLenis } from "@/components/animations/SmoothScrollProvider";

/**
 * Shared helper for scrolling to a homepage section by id.
 *
 * Owned by the navigation layer rather than by the page: the caller decides
 * *when* a fragment should be honoured, this decides *how*.
 *
 * Two things make a naive scroll land in the wrong place:
 *
 *   1. The document is still growing when the route commits. Three fonts load
 *      with `display: swap`, and six sections sit above #reviews, so the
 *      target's offset moves for several frames after the first paint.
 *   2. `lenis.scrollTo(element)` resolves the element to a single number with
 *      getBoundingClientRect() at call time and animates to that fixed number.
 *      It never re-measures, so a target that moves mid-animation is missed.
 *
 * So this samples the target's document offset every frame until two
 * consecutive frames agree, positions once, and then keeps watching for a
 * bounded number of frames to correct any late shift. Every step is driven by
 * measurement or a real browser signal — there is no fixed delay anywhere.
 */

let navigationPending = false;

/**
 * Marks that a fragment link was clicked from another route.
 *
 * HomepageScrollReset checks this so it does not reset the homepage to the top
 * while the navigation layer is on its way to positioning the section.
 */
export function beginFragmentNavigation() {
  navigationPending = true;
}

export function isFragmentNavigationPending() {
  return navigationPending;
}

/** Frame ceiling for the whole operation; it normally settles far sooner. */
const MAX_FRAMES = 90;

export type FragmentScrollOptions = {
  /** Animate instead of jumping. Used for same-page navigation only. */
  smooth?: boolean;
  /** Runs once the first position has been applied. */
  onPositioned?: () => void;
};

/**
 * Scrolls to `fragment` once the layout around it has stopped moving.
 *
 * Returns a cancel function; call it if the caller unmounts or navigates away.
 */
export function scrollToFragment(fragment: string, options: FragmentScrollOptions = {}): () => void {
  let cancelled = false;
  let frame = 0;

  const begin = () => {
    if (cancelled) return;

    const target = document.getElementById(fragment);

    if (!target) {
      // Nothing to scroll to; let the caller finish its own bookkeeping.
      navigationPending = false;
      options.onPositioned?.();
      return;
    }

    const documentOffset = () => target.getBoundingClientRect().top + window.scrollY;

    const position = (documentTop: number) => {
      // The navbar is fixed, so the section would otherwise sit beneath it.
      const navbar = document.querySelector<HTMLElement>(".navbar");
      const top = documentTop - (navbar?.getBoundingClientRect().height ?? 0);
      const lenis = getLenis();

      // A number target, never an element: Lenis must not re-resolve and
      // second-guess the offset that was just measured.
      if (lenis) lenis.scrollTo(top, { immediate: !options.smooth });
      else window.scrollTo({ top, behavior: options.smooth ? "smooth" : "auto" });
    };

    let previous = Number.NaN;
    let stable = 0;
    let frames = 0;
    let positioned = false;

    const step = () => {
      if (cancelled) return;

      const current = documentOffset();
      frames += 1;

      if (!positioned) {
        stable = current === previous ? stable + 1 : 0;
        previous = current;

        // Two identical frames mean the layout above the target has settled.
        if (stable < 2 && frames < MAX_FRAMES) {
          frame = requestAnimationFrame(step);
          return;
        }

        position(current);
        positioned = true;
        navigationPending = false;
        options.onPositioned?.();
        frame = requestAnimationFrame(step);
        return;
      }

      // Positioned: keep watching briefly so a late shift is corrected rather
      // than leaving the visitor a few hundred pixels off.
      if (current !== previous) {
        previous = current;
        position(current);
      }

      if (frames < MAX_FRAMES) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
  };

  // Fonts are the last thing that reflows the page; `ready` is a real signal,
  // and it resolves immediately when they are already loaded.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    void document.fonts.ready.then(begin);
  } else {
    begin();
  }

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}
