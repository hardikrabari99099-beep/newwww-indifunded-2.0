import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";

export default function PageBg3D() {
  const [isMobile, setIsMobile] = useState(false);
  const { settings } = useSettings();
  const enabled = settings.widgets?.bg_3d?.enabled !== false;

  useEffect(() => {
    const check = () => {
      const touch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia("(max-width: 900px)").matches);
      setIsMobile(touch);
    };
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!enabled) return null;
  if (isMobile) {
    return (
      <div className="page-bg-3d page-bg-3d-lite" aria-hidden="true">
        <span className="pb-orb pb-orb-1" />
      </div>
    );
  }
  return (
    <div className="page-bg-3d" aria-hidden="true">
      <span className="pb-orb pb-orb-1" />
      <span className="pb-orb pb-orb-2" />
      <span className="pb-blob" />
    </div>
  );
}
