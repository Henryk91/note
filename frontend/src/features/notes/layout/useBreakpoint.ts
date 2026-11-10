import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** < 768 px: stacked push navigation. 768 - 1099: two panes. >= 1100: three panes. */
export const breakpointForWidth = (width: number): Breakpoint => (width >= 1100 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile');

const current = (): Breakpoint => (typeof window === 'undefined' ? 'mobile' : breakpointForWidth(window.innerWidth));

export const useBreakpoint = (): Breakpoint => {
  const [bp, setBp] = useState<Breakpoint>(current);
  useEffect(() => {
    const onResize = () => setBp(current());
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
};
