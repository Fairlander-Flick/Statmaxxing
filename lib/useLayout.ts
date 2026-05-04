import { useWindowDimensions } from 'react-native';

export type LayoutBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface LayoutInfo {
  width: number;
  height: number;
  breakpoint: LayoutBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Max content width — use this on outer containers */
  maxWidth: number;
  /** Horizontal padding for scroll containers */
  hPadding: number;
  /** Max width for form inputs / buttons */
  inputMaxWidth: number;
  /** Number of stat card columns */
  statColumns: number;
}

export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();

  let breakpoint: LayoutBreakpoint;
  let maxWidth: number;
  let hPadding: number;
  let inputMaxWidth: number;
  let statColumns: number;

  if (width < 600) {
    breakpoint = 'mobile';
    maxWidth = width;
    hPadding = 20;
    inputMaxWidth = width - 40;
    statColumns = 3;
  } else if (width < 960) {
    breakpoint = 'tablet';
    maxWidth = width;
    hPadding = 28;
    inputMaxWidth = 480;
    statColumns = 3;
  } else {
    breakpoint = 'desktop';
    maxWidth = 880;
    hPadding = 40;
    inputMaxWidth = 400;
    statColumns = 3;
  }

  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    maxWidth,
    hPadding,
    inputMaxWidth,
    statColumns,
  };
}
