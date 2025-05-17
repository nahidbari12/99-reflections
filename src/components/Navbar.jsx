// Navbar.js

import React from 'react';

function Navbar({ onNavigate }) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', background: '#282c34', padding: '10px' }}>
      <button onClick={() => onNavigate('home')} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '18px' }}>
        Home
      </button>
      <button onClick={() => onNavigate('game')} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '18px' }}>
        Play
      </button>
      <button onClick={() => onNavigate('leaderboard')} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '18px' }}>
        Leaderboard
      </button>
    </nav>
  );
}

export default Navbar;
