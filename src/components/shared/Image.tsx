// Drop-in replacement for `next/image` -> plain <img>. Drops next-specific
// props (fill, priority, placeholder, ...) and forwards the rest.

import type { ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  alt?: string;
  width?: number | string;
  height?: number | string;
  // next/image-only props, ignored:
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
  sizes?: string;
};

export default function Image({
  src,
  alt = "",
  fill: _fill,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  loader: _loader,
  ...rest
}: ImageProps) {
  const resolvedSrc = typeof src === "string" ? src : src.src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolvedSrc} alt={alt} {...rest} />;
}
