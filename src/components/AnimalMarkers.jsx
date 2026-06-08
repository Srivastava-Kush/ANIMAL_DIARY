import { useMemo, memo } from "react";
import AnimalMarker from "./AnimalMarker";

const AnimalMarkers = memo(function AnimalMarkers({
  animals,
  occurrenceAnimal,
  onDoubleClick,
}) {
  const occurrenceSet = useMemo(() => {
    if (!occurrenceAnimal) return null;
    const set = new Set();
    set.add(occurrenceAnimal.name);
    (occurrenceAnimal.occurrences || []).forEach((o) => {
      set.add(occurrenceAnimal.name + "|" + o.lat + "|" + o.lon);
    });
    return set;
  }, [occurrenceAnimal]);

  const occurrenceMarkers = useMemo(() => {
    if (!occurrenceAnimal) return [];
    return (occurrenceAnimal.occurrences || []).map((o, i) => ({
      ...occurrenceAnimal,
      name: occurrenceAnimal.name + "|occ|" + i,
      lat: o.lat,
      lon: o.lon,
      country: o.country,
      _isOccurrence: true,
      _baseName: occurrenceAnimal.name,
    }));
  }, [occurrenceAnimal]);

  return (
    <>
      {animals.filter(a => a && a.name && a.lat != null && a.lon != null).map((animal) => {
        const isHighlighted =
          occurrenceAnimal && animal.name === occurrenceAnimal.name;
        const isFaded = occurrenceAnimal != null && !isHighlighted;
        return (
          <AnimalMarker
            key={animal.name}
            animal={animal}
            isHighlighted={isHighlighted}
            isFaded={isFaded}
            onDoubleClick={onDoubleClick}
          />
        );
      })}
      {occurrenceMarkers.map((o) => (
        <AnimalMarker
          key={o.name}
          animal={o}
          isHighlighted
          isFaded={false}
          onDoubleClick={() => {}}
        />
      ))}
    </>
  );
});

export default AnimalMarkers;
