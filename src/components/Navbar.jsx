import { useNavigate } from "react-router-dom";

export default function Navbar({ onOpenFlipbook }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-globe">&#x1F30D;</span>
        <span className="navbar-title">Animal Globe</span>
      </div>
      <div className="navbar-actions">
        <button
          className="navbar-identify-btn"
          onClick={() => navigate("/identify")}
        >
          &#x1F412; Identify a Primate
        </button>
        <button className="navbar-diary-btn" onClick={onOpenFlipbook}>
          &#x1F4D3; Open Diary
        </button>
        <button
          className="navbar-identify-btn"
          onClick={() => navigate("/crawl")}
        >
          &#x1F578;&#xFE0F; Crawl &amp; Review
        </button>
      </div>
    </nav>
  );
}
