import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  poster: string;
  className?: string;
}

/**
 * Vidéo d'illustration muette, en boucle, sans contrôles.
 * Ne joue que lorsqu'elle est visible à l'écran ; reste sur l'image d'aperçu (poster)
 * si le visiteur a demandé moins d'animations ou active l'économie de données.
 */
export function LoopVideo({ src, poster, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduced || saveData) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
      className={`block ${className}`}
    />
  );
}
