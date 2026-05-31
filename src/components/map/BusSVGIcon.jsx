/**
 * Renders an SVG bus icon as a Leaflet divIcon HTML string.
 * Used for dynamic, color-coded bus markers on the map.
 */

export function createBusSVGHtml(color = '#2D6A4F', routeNumber = '', heading = 0, isTracked = false) {
  const pulse = isTracked
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:3px solid ${color};animation:busping 1.5s ease-out infinite;opacity:0.6;"></div>`
    : '';
  return `
    <style>
      @keyframes busping {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
    <div style="position:relative;width:38px;height:38px;">
      ${pulse}
      <svg viewBox="0 0 38 38" width="38" height="38" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));transform:rotate(${heading}deg);">
        <rect x="4" y="6" width="30" height="22" rx="6" fill="${color}" stroke="white" stroke-width="2.5"/>
        <rect x="7" y="9" width="11" height="8" rx="2" fill="rgba(255,255,255,0.85)"/>
        <rect x="20" y="9" width="11" height="8" rx="2" fill="rgba(255,255,255,0.85)"/>
        <rect x="4" y="19" width="30" height="4" fill="rgba(0,0,0,0.15)"/>
        <circle cx="10" cy="30" r="4" fill="#1a1a1a" stroke="white" stroke-width="1.5"/>
        <circle cx="28" cy="30" r="4" fill="#1a1a1a" stroke="white" stroke-width="1.5"/>
        <rect x="14" y="20" width="10" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
        <text x="19" y="18" text-anchor="middle" font-size="5" font-weight="bold" fill="white" font-family="sans-serif">${routeNumber}</text>
      </svg>
    </div>
  `;
}

export function createUserSVGHtml() {
  return `
    <style>
      @keyframes userpulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
    </style>
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(45,106,79,0.15);animation:userpulse 2s ease-in-out infinite;"></div>
      <svg viewBox="0 0 24 24" width="24" height="24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <circle cx="12" cy="12" r="10" fill="#2D6A4F" stroke="white" stroke-width="3"/>
        <circle cx="12" cy="12" r="4" fill="#FFD60A"/>
      </svg>
    </div>
  `;
}

export function createStopSVGHtml(color = '#F4A261', isDestination = false) {
  if (isDestination) {
    return `
      <svg viewBox="0 0 28 36" width="28" height="36" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.3));">
        <path d="M14 2 C7 2 2 7 2 14 C2 22 14 34 14 34 C14 34 26 22 26 14 C26 7 21 2 14 2Z" fill="#EF4444" stroke="white" stroke-width="2"/>
        <text x="14" y="18" text-anchor="middle" font-size="12">🏁</text>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 16 16" width="16" height="16" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.25));">
      <circle cx="8" cy="8" r="7" fill="white" stroke="${color}" stroke-width="2.5"/>
      <circle cx="8" cy="8" r="3" fill="${color}"/>
    </svg>
  `;
}