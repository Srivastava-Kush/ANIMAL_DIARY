import { useState, useMemo, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Scene from "./components/Scene";
import AnimalCard from "./components/AnimalCard";
import Flipbook from "./components/Flipbook";
import Navbar from "./components/Navbar";
import SearchPanel from "./components/SearchPanel";
import Legend from "./components/Legend";
import IdentifierPage from "./pages/IdentifierPage";
import CrawlPage from "./pages/CrawlPage";
import animalsData from "./data/animals.json";
import "./App.css";

function GlobePage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [iucnFilter, setIucnFilter] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [occurrenceAnimal, setOccurrenceAnimal] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [flipbookOpen, setFlipbookOpen] = useState(false);

  const filteredAnimals = useMemo(() => {
    return animalsData.filter((a) => {
      const matchSearch =
        !search || a.name.toLowerCase().includes(search.toLowerCase());
      const matchIucn = !iucnFilter || a.iucn_status === iucnFilter;
      return matchSearch && matchIucn;
    });
  }, [search, iucnFilter]);

  const handleAnimalDoubleClick = useCallback((animal) => {
    setSelectedAnimal(animal);
    setOccurrenceAnimal(null);
  }, []);

  const handleShowOccurrences = useCallback((animal) => {
    setSelectedAnimal(null);
    setOccurrenceAnimal(animal);
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedAnimal(null);
  }, []);

  const handleClearOccurrences = useCallback(() => {
    setOccurrenceAnimal(null);
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    const match = animalsData.find((a) =>
      a.name.toLowerCase() === val.toLowerCase()
    );
    if (match) {
      setFlyToTarget({ lat: match.lat, lon: match.lon, _t: Date.now() });
    }
  }, []);

  const handleReset = useCallback(() => {
    setSearch("");
    setIucnFilter("");
    setOccurrenceAnimal(null);
  }, []);

  // When navigating back from the identifier page, auto-trigger show occurrences
  useEffect(() => {
    const name = location.state?.autoShowAnimal;
    if (!name) return;
    const match = animalsData.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (match) handleShowOccurrences(match);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      <Scene
        animals={filteredAnimals}
        occurrenceAnimal={occurrenceAnimal}
        flyToTarget={flyToTarget}
        onAnimalDoubleClick={handleAnimalDoubleClick}
      />

      <Navbar onOpenFlipbook={() => setFlipbookOpen(true)} />

      <SearchPanel
        search={search}
        onSearchChange={handleSearchChange}
        iucnFilter={iucnFilter}
        onIucnFilterChange={setIucnFilter}
        onReset={handleReset}
        occurrenceAnimal={occurrenceAnimal}
        onClearOccurrences={handleClearOccurrences}
        resultCount={filteredAnimals.length}
      />

      <Legend />

      {selectedAnimal && (
        <AnimalCard
          animal={selectedAnimal}
          onClose={handleCloseCard}
          onShowOccurrences={handleShowOccurrences}
        />
      )}

      {flipbookOpen && <Flipbook onClose={() => setFlipbookOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GlobePage />} />
        <Route path="/identify" element={<IdentifierPage />} />
        <Route path="/crawl" element={<CrawlPage />} />
      </Routes>
    </BrowserRouter>
  );
}
