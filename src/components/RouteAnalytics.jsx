import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { rememberVisitedPage } from "../utils/lastVisited";

export default function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    rememberVisitedPage(location);
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
