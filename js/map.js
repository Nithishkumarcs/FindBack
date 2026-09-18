/**
 * FindBack — Campus Location Module (Lightweight Stub)
 * Simplified for College-Level Deployments (Zero Map/Leaflet Dependencies)
 */

const MapUtils = {
  initPicker() {
    return null;
  },
  initSingleItemMap(containerId, lat, lng, title, locationName) {
    const el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted);">
          <i class="fa-solid fa-location-dot" style="color: var(--primary); margin-right: 6px;"></i>
          ${locationName || 'Campus Location'}
        </div>
      `;
    }
    return null;
  },
  initActivityMap(containerId, points = []) {
    return null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapUtils };
}
