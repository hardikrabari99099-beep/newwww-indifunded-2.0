import { useEffect, useRef, useState } from "react";
import { Volume2, Youtube, Video } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { useSettings } from "../context/SettingsContext";
import {
  getReviewInlineEmbedUrl,
  getReviewMedia,
  safeReviewImage,
  youtubeId,
} from "../lib/review-media";

function thumbFor(item, media) {
  const poster = safeReviewImage(item.poster || "");
  if (poster) return poster;
  if (media.kind === "youtube") {
    const id = youtubeId(media.url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
  }
  return undefined;
}

function AutoPlayTraderVideo({ src, poster }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.defaultMuted = true;
    el.muted = true;
    el.playsInline = true;
    el.loop = true;
    el.autoplay = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("autoplay", "");
    const play = () => {
      try {
        el.muted = true;
        if (el.paused) {
          const p = el.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
      } catch {
        // ignore browser autoplay policy restrictions
      }
    };
    const onEnded = () => {
      try {
        el.currentTime = 0;
        play();
      } catch {
        // ignore
      }
    };
    play();
    el.addEventListener("loadedmetadata", play);
    el.addEventListener("loadeddata", play);
    el.addEventListener("canplay", play);
    el.addEventListener("ended", onEnded);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) play();
            },
            { threshold: 0.01, rootMargin: "240px 0px" },
          )
        : null;
    if (io) io.observe(el);

    return () => {
      el.removeEventListener("loadedmetadata", play);
      el.removeEventListener("loadeddata", play);
      el.removeEventListener("canplay", play);
      el.removeEventListener("ended", onEnded);
      if (io) io.disconnect();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
    />
  );
}

function TraderCard({ item, onOpen, decorative }) {
  const media = getReviewMedia(item.url);
  const thumb = thumbFor(item, media);
  const inlineEmbed = media.kind !== "video" ? getReviewInlineEmbedUrl(media) : null;
  const source = media.kind === "youtube" ? "YouTube" : media.kind === "vimeo" ? "Vimeo" : "Video";
  return (
    <article className="trader-card" aria-hidden={decorative || undefined}>
      <button
        type="button"
        className="trader-card-media group"
        onClick={() => onOpen(item)}
        tabIndex={decorative ? -1 : 0}
        aria-label={`Watch ${item.name || "trader"}'s story with sound`}
      >
        {media.kind === "video" ? (
          <AutoPlayTraderVideo src={media.url} poster={thumb} />
        ) : (
          <>
            {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
            {inlineEmbed ? (
              <iframe
                src={inlineEmbed}
                title={`${item.name || "Trader"} inline preview`}
                className="absolute inset-0 w-full h-full pointer-events-none border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                loading="eager"
              />
            ) : !thumb ? (
              <span className="trader-card-fallback">
                <Video />
              </span>
            ) : null}
          </>
        )}
        <span className="trader-card-source">
          {media.kind === "youtube" ? <Youtube size={14} /> : <Video size={14} />}
          {source}
          {item.views ? ` • ${item.views}` : ""}
        </span>
        <span className="trader-card-sound">
          <Volume2 size={13} /> Sound
        </span>
      </button>
      <div className="trader-card-body">
        <h3 className="font-display">
          {item.flag ? <span aria-hidden="true">{item.flag} </span> : null}
          {item.name || "IndiFunded trader"}
        </h3>
        <p>{item.country || item.role || "India"}</p>
        <dl>
          <div>
            <dt>Rewards earned</dt>
            <dd>{item.rewards || "—"}</dd>
          </div>
          <div>
            <dt>Trading style</dt>
            <dd>{item.style || item.label || "—"}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

/** FTMO-style horizontal auto-scrolling trader video cards. Content comes from Admin → Site Settings → Review Videos. */
export default function OurTraders({ showEmpty = false, heading, subtitle }) {
  const { settings } = useSettings();
  const cfg = settings.video_reviews || {};
  const videosVisible = cfg.enabled !== false && settings.home_sections?.trader_videos !== false;
  const items = (cfg.items || []).filter(
    (item) => item.enabled !== false && getReviewMedia(item.url || ""),
  );
  const [active, setActive] = useState(null);
  const media = active ? getReviewMedia(active.url) : null;

  if (!videosVisible) return null;
  if (!items.length && !showEmpty) return null;
  const reps = Math.max(1, Math.min(2, Math.ceil(4 / Math.max(items.length, 1))));
  const half = Array.from({ length: reps }, () => items).flat();
  const loop = [...half, ...half];

  return (
    <section className="home-band our-traders-band" data-testid="our-traders">
      <div className="container-xl">
        <div className="home-section-heading">
          <div>
            <div className="home-eyebrow">Our traders</div>
            <h2 className="font-display">{heading || "Real traders. Real stories."}</h2>
            <p>
              {subtitle ||
                "Hear directly from IndiFunded traders about their journey, style and rewards."}
            </p>
          </div>
        </div>
      </div>
      {items.length ? (
        <div className="trader-marquee-wrap">
          <div
            className="trader-marquee"
            style={{ animationDuration: `${Math.max(48, half.length * 11)}s` }}
          >
            {loop.map((item, i) => (
              <TraderCard key={i} item={item} onOpen={setActive} decorative={i >= items.length} />
            ))}
          </div>
        </div>
      ) : (
        <div className="container-xl">
          <div className="card-panel p-10 text-center text-[var(--muted)]">
            Trader video stories are coming soon.
          </div>
        </div>
      )}
      <Dialog
        open={!!active}
        onOpenChange={(v) => {
          if (!v) setActive(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogTitle>{active?.name || "Trader"}'s story</DialogTitle>
          <DialogDescription>
            {[active?.country, active?.style].filter(Boolean).join(" · ") ||
              "IndiFunded trading journey"}
          </DialogDescription>
          {media &&
            (media.kind === "video" ? (
              <video className="review-player" src={media.url} controls autoPlay loop playsInline />
            ) : (
              <iframe
                className="review-player"
                src={media.url}
                title={`${active?.name || "Trader"} video`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ))}
        </DialogContent>
      </Dialog>
    </section>
  );
}
