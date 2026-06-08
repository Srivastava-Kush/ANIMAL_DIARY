import { useState, useEffect } from "react";

const cache = new Map();

async function resolve(imgUrl) {
  if (cache.has(imgUrl)) return cache.get(imgUrl);

  let url = imgUrl;
  if (imgUrl.includes("commons.wikimedia.org")) {
    const filename = decodeURIComponent(imgUrl.split("/").pop());
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];
    if (page.imageinfo?.[0]) {
      url = page.imageinfo[0].url;
    }
  }

  cache.set(imgUrl, url);
  return url;
}

export function useResolvedImageUrl(imgUrl) {
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    if (!imgUrl) return;
    resolve(imgUrl)
      .then(setResolved)
      .catch(() => {});
  }, [imgUrl]);

  return resolved;
}
