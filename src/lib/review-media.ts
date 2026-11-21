export type ReviewMedia = { kind: "video" | "youtube" | "vimeo"; url: string };

const LOCAL_MEDIA_RE = /^\/api\/media\/[\w-]+(?:\.(?:mp4|webm|mov))?(?:\?[\w=&-]+)?$/i;

export function getReviewMedia(value: string): ReviewMedia | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (LOCAL_MEDIA_RE.test(raw)) {
    return { kind: "video", url: raw };
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
      const id =
        host === "youtu.be"
          ? url.pathname.slice(1)
          : url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return {
        kind: "youtube",
        url: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      };
    }
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
      const id = url.pathname.match(/\/(\d+)\/?$/)?.[1];
      return id ? { kind: "vimeo", url: `https://player.vimeo.com/video/${id}?autoplay=1` } : null;
    }
    if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return { kind: "video", url: url.href };
    return null;
  } catch {
    return null;
  }
}

/** 11-char YouTube id from a normalized embed URL (output of getReviewMedia). */
export function youtubeId(embedUrl: string): string | null {
  return embedUrl.match(/embed\/([\w-]{11})/)?.[1] ?? null;
}

/** Muted, looping inline preview URL for YouTube/Vimeo review tiles so videos autoplay seamlessly while scrolling. */
export function getReviewInlineEmbedUrl(media: ReviewMedia | null | undefined): string | null {
  if (!media) return null;
  if (media.kind === "youtube") {
    const id = youtubeId(media.url);
    return id
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0`
      : media.url;
  }
  if (media.kind === "vimeo") {
    const id = media.url.match(/video\/(\d+)/)?.[1];
    return id
      ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&background=1&loop=1&playsinline=1`
      : media.url;
  }
  return media.url;
}

export function safeReviewImage(value: string): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^\/api\/media\/[\w-]+(?:\.(?:jpg|jpeg|png|webp))?$/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
