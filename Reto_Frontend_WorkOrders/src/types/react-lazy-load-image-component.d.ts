declare module 'react-lazy-load-image-component' {
  import * as React from 'react';

  export interface LazyLoadImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    effect?: 'blur' | 'black-and-white' | 'opacity';
    placeholderSrc?: string;
    placeholder?: React.ReactNode;
    threshold?: number;
    visibleByDefault?: boolean;
    wrapperClassName?: string;
    wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
    scrollPosition?: { x: number; y: number };
    useIntersectionObserver?: boolean;
    delayMethod?: 'throttle' | 'debounce';
    delayTime?: number;
    onLoad?: () => void;
    onError?: () => void;
    beforeLoad?: () => void;
    afterLoad?: () => void;
  }

  export const LazyLoadImage: React.FC<LazyLoadImageProps>;
  export default LazyLoadImage;
}

