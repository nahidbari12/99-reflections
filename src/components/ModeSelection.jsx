import React from "react";
import { Navigate } from "react-router-dom";

// Kept as a compatibility route for old bookmarks and shared links.
export default function ModeSelection() {
  return <Navigate to="/learning-mode" replace />;
}
