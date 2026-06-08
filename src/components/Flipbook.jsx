import { useState, useEffect, useCallback } from "react";

const TOTAL_PAGES = 27;
const pages = Array.from(
  { length: TOTAL_PAGES },
  (_, i) => `/images/sea-animal-images/sea-animal-image-${i + 1}.jpg`
);

export default function Flipbook({ onClose }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(null);
  const [animating, setAnimating] = useState(false);

  const navigate = useCallback(
    (dir) => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) =>
          dir === "next"
            ? (c + 1) % TOTAL_PAGES
            : (c - 1 + TOTAL_PAGES) % TOTAL_PAGES
        );
        setDirection(null);
        setAnimating(false);
      }, 400);
    },
    [animating]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") navigate("next");
      if (e.key === "ArrowLeft") navigate("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, navigate]);

  return (
    <div className="flipbook-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flipbook-modal">
        <button className="flipbook-close" onClick={onClose}>×</button>
        <h2 className="flipbook-title">🐠 My Animal Diary</h2>
        <p className="flipbook-subtitle">The original notebook — page {current + 1} of {TOTAL_PAGES}</p>

        <div className="flipbook-stage">
          <div
            className={`flipbook-page ${animating && direction === "prev" ? "flip-out-right" : ""} ${animating && direction === "next" ? "flip-out-left" : ""}`}
          >
            <img
              src={pages[current]}
              alt={`Animal diary page ${current + 1}`}
              className="flipbook-img"
            />
          </div>
        </div>

        <div className="flipbook-nav">
          <button
            className="flipbook-btn"
            onClick={() => navigate("prev")}
            disabled={animating}
          >
            ← Prev
          </button>
          <div className="flipbook-dots">
            {Array.from({ length: Math.min(TOTAL_PAGES, 9) }).map((_, i) => {
              const idx = i === 8 ? current : Math.floor((i / 8) * TOTAL_PAGES);
              return (
                <span
                  key={i}
                  className={`flipbook-dot ${Math.floor((current / TOTAL_PAGES) * 8) === i || (i === 8 && true) ? "" : ""}`}
                />
              );
            })}
            <span className="flipbook-page-count">{current + 1}/{TOTAL_PAGES}</span>
          </div>
          <button
            className="flipbook-btn"
            onClick={() => navigate("next")}
            disabled={animating}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
