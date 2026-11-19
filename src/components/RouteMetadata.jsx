import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import metadata from "../data/seoMetadata.json";

export function metadataForPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") + "/";
  return metadata[normalized] || null;
}

function setHeadElement(selector, tag, attributes) {
  const matches = [...document.head.querySelectorAll(selector)];
  const element = matches.shift() || document.createElement(tag);
  matches.forEach((duplicate) => duplicate.remove());
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (!element.parentNode) document.head.appendChild(element);
  return element;
}

// Update the same tags that ship in each HTML page, including after client navigation.
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const page = metadataForPath(pathname);
    document.title = page?.title || "Page not found | 99 Reflections";
    setHeadElement('meta[name="robots"]', "meta", { name: "robots", content: page?.indexable ? "index, follow" : "noindex, follow" });
    setHeadElement('meta[name="description"]', "meta", { name: "description", content: page?.description || "This page could not be found. Explore the 99 Names of Allah with 99 Reflections." });
    if (page) {
      setHeadElement('link[rel="canonical"]', "link", { rel: "canonical", href: page.canonical });
      for (const [property, content] of Object.entries({ "og:title": page.title, "og:description": page.description, "og:url": page.canonical })) {
        setHeadElement(`meta[property="${property}"]`, "meta", { property, content });
      }
      setHeadElement('#page-schema', "script", { id: "page-schema", type: "application/ld+json" }).textContent = JSON.stringify(page.schema);
    } else {
      document.head.querySelectorAll('link[rel="canonical"], #page-schema, meta[property="og:url"]').forEach((tag) => tag.remove());
    }
  }, [pathname]);
  return null;
}
