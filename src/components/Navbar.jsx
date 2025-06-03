import React from "react";

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          {/* ✅ Fixed href */}
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/gamer-mode">Gamer Mode</a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
