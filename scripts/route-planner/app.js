/**
 * Baja Route Planner - Main Application
 */

// State
const state = {
  start: null,        // { lat, lng, name }
  end: null,          // { lat, lng, name }
  waypoints: [],      // [{ lat, lng }]
  pois: [],           // [{ id, name, coordinates, category, description, phone, hours }]
  routePolyline: null,// Encoded polyline from API
  routeInfo: null,    // { distanceMiles, duration }
  mode: 'url'         // 'text' or 'url' - default to URL mode (no API needed)
};

// Map and layers
let map;
let routeLayer;
let markersLayer;

// Category colors (matching existing project)
const CATEGORY_COLORS = {
  gas: '#facc15',
  restaurant: '#fb923c',
  poi: '#3b82f6',
  viewpoint: '#22c55e',
  photo: '#a855f7',
  border: '#ef4444',
  emergency: '#dc2626'
};

const CATEGORY_LABELS = {
  gas: 'Gas',
  restaurant: 'Food',
  poi: 'POI',
  viewpoint: 'View',
  photo: 'Photo',
  border: 'Border',
  emergency: 'SOS'
};

// Parse Google Maps URL locally (no API needed)
function parseGoogleMapsUrlLocal(url) {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL input:', url);
    return null;
  }

  try {
    const decoded = decodeURIComponent(url);
    let lat, lng, name;

    console.log('Parsing URL:', decoded.substring(0, 100) + '...');

    // Try @lat,lng format (most common)
    const atMatch = decoded.match(/@(-?[\d.]+),(-?[\d.]+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
      console.log('Found @lat,lng:', lat, lng);
    }

    // Try !3d!4d format
    if (!lat || !lng) {
      const dataMatch = decoded.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
      if (dataMatch) {
        lat = parseFloat(dataMatch[1]);
        lng = parseFloat(dataMatch[2]);
        console.log('Found !3d!4d:', lat, lng);
      }
    }

    // Try ?q=lat,lng format
    if (!lat || !lng) {
      const qMatch = decoded.match(/[?&]q=(-?[\d.]+),(-?[\d.]+)/);
      if (qMatch) {
        lat = parseFloat(qMatch[1]);
        lng = parseFloat(qMatch[2]);
        console.log('Found ?q=:', lat, lng);
      }
    }

    // Try ll=lat,lng format (another common format)
    if (!lat || !lng) {
      const llMatch = decoded.match(/ll=(-?[\d.]+),(-?[\d.]+)/);
      if (llMatch) {
        lat = parseFloat(llMatch[1]);
        lng = parseFloat(llMatch[2]);
        console.log('Found ll=:', lat, lng);
      }
    }

    // Extract place name from /place/ path
    const placeMatch = decoded.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      name = placeMatch[1].replace(/\+/g, ' ').replace(/%20/g, ' ');
      console.log('Found place name:', name);
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const result = { lat, lng, name: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
      console.log('Parse result:', result);
      return result;
    }

    console.error('Could not extract coordinates from URL');
    return null;
  } catch (e) {
    console.error('URL parse error:', e);
    return null;
  }
}

// Toggle between text and URL mode
function setMode(mode) {
  state.mode = mode;
  const textMode = document.getElementById('textMode');
  const urlMode = document.getElementById('urlMode');
  const textBtn = document.getElementById('modeTextBtn');
  const urlBtn = document.getElementById('modeUrlBtn');

  if (mode === 'text') {
    textMode.style.display = 'block';
    urlMode.style.display = 'none';
    textBtn.classList.add('btn-active');
    urlBtn.classList.remove('btn-active');
  } else {
    textMode.style.display = 'none';
    urlMode.style.display = 'block';
    textBtn.classList.remove('btn-active');
    urlBtn.classList.add('btn-active');
  }
}

// Initialize map
function initMap() {
  map = L.map('map').setView([27.5, -112.5], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  // Click to add waypoint
  map.on('click', (e) => {
    if (state.start && state.end) {
      addWaypoint(e.latlng.lat, e.latlng.lng);
    }
  });
}

// Create custom marker icon
function createMarkerIcon(type, label = '') {
  const color = type === 'start' ? '#22c55e' :
                type === 'end' ? '#ef4444' :
                type === 'waypoint' ? '#3b82f6' :
                CATEGORY_COLORS[type] || '#3b82f6';

  return L.divIcon({
    className: 'custom-marker-container',
    html: `<div class="custom-marker ${type}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

// Render all markers on map
function renderMarkers() {
  markersLayer.clearLayers();

  // Start marker
  if (state.start) {
    const marker = L.marker([state.start.lat, state.start.lng], {
      icon: createMarkerIcon('start', 'A'),
      draggable: true
    });
    marker.bindPopup(createPopup('start', state.start));
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      state.start.lat = pos.lat;
      state.start.lng = pos.lng;
      updateRoute();
      renderRouteItems();
    });
    markersLayer.addLayer(marker);
  }

  // End marker
  if (state.end) {
    const marker = L.marker([state.end.lat, state.end.lng], {
      icon: createMarkerIcon('end', 'B'),
      draggable: true
    });
    marker.bindPopup(createPopup('end', state.end));
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      state.end.lat = pos.lat;
      state.end.lng = pos.lng;
      updateRoute();
      renderRouteItems();
    });
    markersLayer.addLayer(marker);
  }

  // Waypoint markers
  state.waypoints.forEach((wp, index) => {
    const marker = L.marker([wp.lat, wp.lng], {
      icon: createMarkerIcon('waypoint', String(index + 1)),
      draggable: true
    });
    marker.bindPopup(createWaypointPopup(index, wp));
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      state.waypoints[index].lat = pos.lat;
      state.waypoints[index].lng = pos.lng;
      updateRoute();
      renderRouteItems();
    });
    markersLayer.addLayer(marker);
  });

  // POI markers
  state.pois.forEach((poi) => {
    const marker = L.marker([poi.coordinates.lat, poi.coordinates.lng], {
      icon: createMarkerIcon(poi.category, CATEGORY_LABELS[poi.category] || 'POI')
    });
    marker.bindPopup(createPOIPopup(poi));
    markersLayer.addLayer(marker);
  });
}

// Create popup content for start/end
function createPopup(type, data) {
  const label = type === 'start' ? 'Start' : 'End';
  return `
    <div class="popup-title">${label}: ${data.name}</div>
    <div class="popup-coords">${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}</div>
  `;
}

// Create popup for waypoint
function createWaypointPopup(index, wp) {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="popup-title">Waypoint ${index + 1}</div>
    <div class="popup-coords">${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</div>
    <div class="popup-actions">
      <button class="delete" onclick="deleteWaypoint(${index})">Delete</button>
    </div>
  `;
  return div;
}

// Create popup for POI
function createPOIPopup(poi) {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="popup-title">${poi.name}</div>
    <div class="popup-coords">${poi.coordinates.lat.toFixed(4)}, ${poi.coordinates.lng.toFixed(4)}</div>
    ${poi.description ? `<div style="font-size: 0.8rem; margin-top: 4px;">${poi.description}</div>` : ''}
    ${poi.phone ? `<div style="font-size: 0.75rem; color: #888;">Phone: ${poi.phone}</div>` : ''}
    <div class="popup-actions">
      <button onclick="editPOI('${poi.id}')">Edit</button>
      <button class="delete" onclick="deletePOI('${poi.id}')">Delete</button>
    </div>
  `;
  return div;
}

// Decode polyline to points
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Render route line on map
function renderRoute() {
  routeLayer.clearLayers();

  if (state.routePolyline) {
    const points = decodePolyline(state.routePolyline);
    const line = L.polyline(points, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8
    });
    routeLayer.addLayer(line);

    // Fit map to route
    map.fitBounds(line.getBounds(), { padding: [50, 50] });
  }
}

// Update route using OSRM (free, no API key needed)
async function updateRoute() {
  if (!state.start || !state.end) return;

  try {
    // Build coordinates string for OSRM: lng,lat;lng,lat;...
    const coords = [
      `${state.start.lng},${state.start.lat}`,
      ...state.waypoints.map(wp => `${wp.lng},${wp.lat}`),
      `${state.end.lng},${state.end.lat}`
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`;
    console.log('OSRM request:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(data.message || 'OSRM routing failed');
    }

    const route = data.routes[0];
    state.routePolyline = route.geometry;

    // Convert meters to miles, seconds to readable duration
    const distanceMiles = (route.distance / 1609.34).toFixed(1);
    const hours = Math.floor(route.duration / 3600);
    const minutes = Math.round((route.duration % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    state.routeInfo = {
      distanceMiles: parseFloat(distanceMiles),
      duration: duration
    };

    renderRoute();
    showRouteInfo();
    console.log('Route loaded:', distanceMiles, 'miles,', duration);

  } catch (err) {
    console.error('Route error:', err);
    // Fallback: draw straight line
    routeLayer.clearLayers();
    const points = [
      [state.start.lat, state.start.lng],
      ...state.waypoints.map(wp => [wp.lat, wp.lng]),
      [state.end.lat, state.end.lng]
    ];
    const line = L.polyline(points, { color: '#3b82f6', weight: 4, dashArray: '10, 10' });
    routeLayer.addLayer(line);
    map.fitBounds(line.getBounds(), { padding: [50, 50] });

    // Show approximate straight-line distance
    const straightDistance = calculateDistance(state.start.lat, state.start.lng, state.end.lat, state.end.lng);
    state.routeInfo = {
      distanceMiles: straightDistance,
      duration: 'N/A (straight line)'
    };
    showRouteInfo();
  }
}

// Calculate straight-line distance in miles (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Show route info
function showRouteInfo() {
  const routeInfoDiv = document.getElementById('routeInfo');
  if (state.routeInfo) {
    document.getElementById('routeDistance').textContent = `${state.routeInfo.distanceMiles} miles`;
    document.getElementById('routeDuration').textContent = state.routeInfo.duration;
    routeInfoDiv.style.display = 'block';
  } else {
    routeInfoDiv.style.display = 'none';
  }
}

// Render route items in sidebar
function renderRouteItems() {
  const container = document.getElementById('routeItems');

  if (!state.start && !state.end && state.waypoints.length === 0 && state.pois.length === 0) {
    container.innerHTML = '<p class="empty-message">Set a route to begin</p>';
    return;
  }

  let html = '';

  // Start
  if (state.start) {
    html += `
      <div class="route-item">
        <div class="route-item-icon start">A</div>
        <div class="route-item-content">
          <div class="route-item-name">${state.start.name}</div>
          <div class="route-item-coords">${state.start.lat.toFixed(4)}, ${state.start.lng.toFixed(4)}</div>
        </div>
      </div>
    `;
  }

  // Waypoints and POIs (sorted by position along route)
  const waypointsWithIndex = state.waypoints.map((wp, i) => ({ ...wp, type: 'waypoint', index: i }));
  const poisForList = state.pois.map(poi => ({ ...poi, type: 'poi' }));

  // For now, just list waypoints then POIs
  waypointsWithIndex.forEach((wp, i) => {
    const wpName = wp.name || `Waypoint ${i + 1}`;
    html += `
      <div class="route-item">
        <div class="route-item-icon waypoint">${i + 1}</div>
        <div class="route-item-content">
          <div class="route-item-name">${wpName}</div>
          <div class="route-item-coords">${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</div>
        </div>
        <div class="route-item-actions">
          <button class="delete" onclick="deleteWaypoint(${wp.index})">x</button>
        </div>
      </div>
    `;
  });

  poisForList.forEach(poi => {
    html += `
      <div class="route-item">
        <div class="route-item-icon ${poi.category}">${CATEGORY_LABELS[poi.category] || 'POI'}</div>
        <div class="route-item-content">
          <div class="route-item-name">${poi.name}</div>
          <div class="route-item-coords">${poi.coordinates.lat.toFixed(4)}, ${poi.coordinates.lng.toFixed(4)}</div>
        </div>
        <div class="route-item-actions">
          <button onclick="editPOI('${poi.id}')">e</button>
          <button class="delete" onclick="deletePOI('${poi.id}')">x</button>
        </div>
      </div>
    `;
  });

  // End
  if (state.end) {
    html += `
      <div class="route-item">
        <div class="route-item-icon end">B</div>
        <div class="route-item-content">
          <div class="route-item-name">${state.end.name}</div>
          <div class="route-item-coords">${state.end.lat.toFixed(4)}, ${state.end.lng.toFixed(4)}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// Set route from inputs
async function setRoute() {
  const btn = document.getElementById('setRouteBtn');
  btn.disabled = true;
  btn.textContent = 'Loading...';

  try {
    console.log('setRoute called, mode:', state.mode);

    if (state.mode === 'url') {
      // URL mode - parse locally, no API needed
      const startUrlEl = document.getElementById('startUrlInput');
      const endUrlEl = document.getElementById('endUrlInput');
      const startNameEl = document.getElementById('startNameInput');
      const endNameEl = document.getElementById('endNameInput');

      console.log('URL elements found:', !!startUrlEl, !!endUrlEl);

      const startUrl = startUrlEl ? startUrlEl.value.trim() : '';
      const endUrl = endUrlEl ? endUrlEl.value.trim() : '';
      const startName = startNameEl ? startNameEl.value.trim() : '';
      const endName = endNameEl ? endNameEl.value.trim() : '';

      console.log('Start URL:', startUrl.substring(0, 50) + '...');
      console.log('End URL:', endUrl.substring(0, 50) + '...');

      if (!startUrl || !endUrl) {
        throw new Error('Please paste Google Maps URLs for both start and end locations');
      }

      const startParsed = parseGoogleMapsUrlLocal(startUrl);
      const endParsed = parseGoogleMapsUrlLocal(endUrl);

      console.log('Parsed start:', startParsed);
      console.log('Parsed end:', endParsed);

      if (!startParsed) {
        throw new Error('Could not parse start URL. Make sure it contains coordinates (look for @ symbol in the URL)');
      }
      if (!endParsed) {
        throw new Error('Could not parse end URL. Make sure it contains coordinates (look for @ symbol in the URL)');
      }

      state.start = {
        lat: startParsed.lat,
        lng: startParsed.lng,
        name: startName || startParsed.name
      };

      state.end = {
        lat: endParsed.lat,
        lng: endParsed.lng,
        name: endName || endParsed.name
      };

    } else {
      // Text mode - requires API
      const startInput = document.getElementById('startInput').value.trim();
      const endInput = document.getElementById('endInput').value.trim();

      if (!startInput || !endInput) {
        throw new Error('Please enter both start and end locations');
      }

      // Geocode start
      const startResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: startInput })
      });
      const startData = await startResponse.json();
      if (!startResponse.ok) throw new Error(startData.error);

      state.start = {
        lat: startData.lat,
        lng: startData.lng,
        name: startData.formattedAddress || startInput
      };

      // Geocode end
      const endResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: endInput })
      });
      const endData = await endResponse.json();
      if (!endResponse.ok) throw new Error(endData.error);

      state.end = {
        lat: endData.lat,
        lng: endData.lng,
        name: endData.formattedAddress || endInput
      };
    }

    // Clear waypoints and POIs for new route
    state.waypoints = [];
    state.pois = [];

    await updateRoute();
    renderMarkers();
    renderRouteItems();

  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Set Route';
  }
}

// Add waypoint
function addWaypoint(lat, lng) {
  state.waypoints.push({ lat, lng });
  updateRoute();
  renderMarkers();
  renderRouteItems();
}

// Delete waypoint
function deleteWaypoint(index) {
  state.waypoints.splice(index, 1);
  updateRoute();
  renderMarkers();
  renderRouteItems();
}

// Search for places along route
async function searchPlaces(query) {
  if (!state.routePolyline) {
    alert('Please set a route first');
    return;
  }

  const buttons = document.querySelectorAll('.btn-discover');
  buttons.forEach(btn => btn.classList.add('loading'));

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polyline: state.routePolyline,
        query: query
      })
    });

    const results = await response.json();
    if (!response.ok) throw new Error(results.error);

    displaySearchResults(results, query);

  } catch (err) {
    alert('Search error: ' + err.message);
  } finally {
    buttons.forEach(btn => btn.classList.remove('loading'));
  }
}

// Display search results
function displaySearchResults(results, query) {
  const container = document.getElementById('searchResults');
  const list = document.getElementById('resultsList');
  const count = document.getElementById('resultsCount');

  count.textContent = `${results.length} results for "${query}"`;

  if (results.length === 0) {
    list.innerHTML = '<p class="empty-message">No results found</p>';
  } else {
    list.innerHTML = results.map(result => `
      <div class="result-item">
        <div class="result-info">
          <div class="result-name">${result.name}</div>
          <div class="result-meta">
            ${result.rating ? `${result.rating}★ (${result.reviewCount})` : ''}
            ${result.address ? ` &bull; ${result.address.substring(0, 30)}...` : ''}
          </div>
        </div>
        <button class="btn btn-primary" onclick='addSearchResult(${JSON.stringify(result)}, "${query}")'>Add</button>
      </div>
    `).join('');
  }

  container.style.display = 'block';
}

// Add search result as POI
function addSearchResult(result, query) {
  const category = query.includes('gas') ? 'gas' :
                   query.includes('restaurant') ? 'restaurant' :
                   query.includes('scenic') ? 'viewpoint' : 'poi';

  const poi = {
    id: `${category}-${Date.now()}`,
    name: result.name,
    coordinates: { lat: result.lat, lng: result.lng },
    category: category,
    description: result.address || '',
    phone: result.phone || ''
  };

  state.pois.push(poi);
  renderMarkers();
  renderRouteItems();
}

// Clear search results
function clearSearchResults() {
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('resultsList').innerHTML = '';
}

// Add waypoint from URL (local parsing, no server needed)
async function addWaypointFromUrl() {
  const urlInput = document.getElementById('waypointUrlInput').value.trim();

  if (!urlInput) {
    alert('Please paste a Google Maps URL');
    return;
  }

  if (!state.start || !state.end) {
    alert('Please set a route first');
    return;
  }

  const parsed = parseGoogleMapsUrlLocal(urlInput);

  if (!parsed) {
    alert('Could not parse URL. Make sure it contains coordinates (look for @ symbol in the URL)');
    return;
  }

  // Add as waypoint
  state.waypoints.push({ lat: parsed.lat, lng: parsed.lng, name: parsed.name });

  document.getElementById('waypointUrlInput').value = '';

  await updateRoute();
  renderMarkers();
  renderRouteItems();
}

// Add POI from URL (local parsing, no server needed)
function addFromUrl() {
  const urlInput = document.getElementById('urlInput').value.trim();
  const category = document.getElementById('urlCategory').value;

  if (!urlInput) {
    alert('Please paste a Google Maps URL');
    return;
  }

  const parsed = parseGoogleMapsUrlLocal(urlInput);

  if (!parsed) {
    alert('Could not parse URL. Make sure it contains coordinates (look for @ symbol in the URL)');
    return;
  }

  // Open POI modal with parsed data
  openPOIModal({
    name: parsed.name || '',
    coordinates: { lat: parsed.lat, lng: parsed.lng },
    category: category,
    description: '',
    phone: '',
    hours: ''
  });

  document.getElementById('urlInput').value = '';
}

// Open POI modal
function openPOIModal(poi = null, isEdit = false) {
  const modal = document.getElementById('poiModal');
  const title = document.getElementById('modalTitle');

  title.textContent = isEdit ? 'Edit POI' : 'Add POI';

  document.getElementById('poiName').value = poi?.name || '';
  document.getElementById('poiCategory').value = poi?.category || 'poi';
  document.getElementById('poiDescription').value = poi?.description || '';
  document.getElementById('poiPhone').value = poi?.phone || '';
  document.getElementById('poiHours').value = poi?.hours || '';
  document.getElementById('poiLat').value = poi?.coordinates?.lat || '';
  document.getElementById('poiLng').value = poi?.coordinates?.lng || '';
  document.getElementById('poiEditId').value = isEdit ? poi.id : '';

  modal.style.display = 'flex';
}

// Close POI modal
function closePOIModal() {
  document.getElementById('poiModal').style.display = 'none';
}

// Save POI from modal
function savePOI() {
  const name = document.getElementById('poiName').value.trim();
  const category = document.getElementById('poiCategory').value;
  const description = document.getElementById('poiDescription').value.trim();
  const phone = document.getElementById('poiPhone').value.trim();
  const hours = document.getElementById('poiHours').value.trim();
  const lat = parseFloat(document.getElementById('poiLat').value);
  const lng = parseFloat(document.getElementById('poiLng').value);
  const editId = document.getElementById('poiEditId').value;

  if (!name) {
    alert('Name is required');
    return;
  }

  if (isNaN(lat) || isNaN(lng)) {
    alert('Valid coordinates are required');
    return;
  }

  const poi = {
    id: editId || `${category}-${Date.now()}`,
    name,
    coordinates: { lat, lng },
    category,
    description,
    phone: phone || undefined,
    hours: hours || undefined
  };

  if (editId) {
    // Update existing
    const index = state.pois.findIndex(p => p.id === editId);
    if (index !== -1) {
      state.pois[index] = poi;
    }
  } else {
    // Add new
    state.pois.push(poi);
  }

  closePOIModal();
  renderMarkers();
  renderRouteItems();
}

// Edit POI
function editPOI(id) {
  const poi = state.pois.find(p => p.id === id);
  if (poi) {
    openPOIModal(poi, true);
  }
}

// Delete POI
function deletePOI(id) {
  state.pois = state.pois.filter(p => p.id !== id);
  renderMarkers();
  renderRouteItems();
}

// Export to JSON
function exportJSON() {
  if (!state.start || !state.end) {
    alert('Please set a route first');
    return;
  }

  // Decode polyline to GeoJSON LineString coordinates
  let routeGeometry = null;
  if (state.routePolyline) {
    const points = decodePolyline(state.routePolyline);
    routeGeometry = {
      type: 'LineString',
      coordinates: points.map(p => [p[1], p[0]]) // Convert [lat,lng] to [lng,lat] for GeoJSON
    };
  }

  const routeConfig = {
    startName: state.start.name,
    startCoordinates: { lat: state.start.lat, lng: state.start.lng },
    endName: state.end.name,
    endCoordinates: { lat: state.end.lat, lng: state.end.lng },
    waypoints: state.waypoints.map(wp => ({
      lat: wp.lat,
      lng: wp.lng,
      name: wp.name || undefined
    })),
    pois: state.pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      coordinates: poi.coordinates,
      category: poi.category,
      description: poi.description || '',
      phone: poi.phone,
      hours: poi.hours
    })),
    estimatedDistance: state.routeInfo?.distanceMiles,
    estimatedTime: state.routeInfo?.duration,
    // NEW: Pre-calculated route geometry for instant map rendering
    routeGeometry: routeGeometry
  };

  const blob = new Blob([JSON.stringify(routeConfig, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `route-${state.end.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import from JSON
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      state.start = {
        lat: data.startCoordinates.lat,
        lng: data.startCoordinates.lng,
        name: data.startName
      };

      state.end = {
        lat: data.endCoordinates.lat,
        lng: data.endCoordinates.lng,
        name: data.endName
      };

      state.waypoints = data.waypoints || [];
      state.pois = data.pois || [];

      // Update URL mode inputs if visible
      const startNameInput = document.getElementById('startNameInput');
      const endNameInput = document.getElementById('endNameInput');
      if (startNameInput) startNameInput.value = data.startName;
      if (endNameInput) endNameInput.value = data.endName;

      // If we have stored route geometry, use it; otherwise fetch fresh
      if (data.routeGeometry && data.routeGeometry.coordinates) {
        // Convert GeoJSON [lng,lat] back to polyline for display
        const points = data.routeGeometry.coordinates.map(c => [c[1], c[0]]);
        routeLayer.clearLayers();
        const line = L.polyline(points, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        });
        routeLayer.addLayer(line);
        map.fitBounds(line.getBounds(), { padding: [50, 50] });

        // Restore route info
        state.routeInfo = {
          distanceMiles: data.estimatedDistance,
          duration: data.estimatedTime
        };
        showRouteInfo();
      } else {
        // No stored geometry, fetch from OSRM
        await updateRoute();
      }

      renderMarkers();
      renderRouteItems();

    } catch (err) {
      alert('Error importing JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initMap();

  // Mode toggle buttons
  document.getElementById('modeTextBtn').addEventListener('click', () => setMode('text'));
  document.getElementById('modeUrlBtn').addEventListener('click', () => setMode('url'));

  // Default to URL mode (no API needed)
  setMode('url');

  // Route button
  document.getElementById('setRouteBtn').addEventListener('click', setRoute);

  // Discover buttons
  document.querySelectorAll('.btn-discover').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      searchPlaces(query);
    });
  });

  // Clear results
  document.getElementById('clearResultsBtn').addEventListener('click', clearSearchResults);

  // Add waypoint from URL
  document.getElementById('addWaypointFromUrlBtn').addEventListener('click', addWaypointFromUrl);

  // Add POI from URL
  document.getElementById('addFromUrlBtn').addEventListener('click', addFromUrl);

  // Modal buttons
  document.getElementById('cancelPoiBtn').addEventListener('click', closePOIModal);
  document.getElementById('savePoiBtn').addEventListener('click', savePOI);

  // Import/Export
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importJSON(e.target.files[0]);
    }
  });

  // Close modal on outside click
  document.getElementById('poiModal').addEventListener('click', (e) => {
    if (e.target.id === 'poiModal') {
      closePOIModal();
    }
  });
});

// Expose functions for inline handlers
window.deleteWaypoint = deleteWaypoint;
window.editPOI = editPOI;
window.deletePOI = deletePOI;
window.addSearchResult = addSearchResult;
