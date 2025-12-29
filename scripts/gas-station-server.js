#!/usr/bin/env node

/**
 * Gas Station Finder Server
 *
 * A simple server that provides an API and web UI
 * for finding gas stations along a Google Maps route.
 *
 * Usage:
 *   export GOOGLE_MAPS_API_KEY="your-key-here"
 *   node gas-station-server.js
 *   Open http://localhost:3456
 */

import http from 'http';
import { parse as parseUrl } from 'url';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PORT = 3456;

// Expand short Google Maps URLs by following redirects
async function expandShortUrl(shortUrl) {
  if (!shortUrl.includes('maps.app.goo.gl') && !shortUrl.includes('goo.gl/maps')) {
    return shortUrl; // Not a short URL
  }

  let currentUrl = shortUrl;
  const maxRedirects = 5;

  try {
    for (let i = 0; i < maxRedirects; i++) {
      console.log(`Redirect ${i + 1}: ${currentUrl}`);
      const response = await fetch(currentUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const location = response.headers.get('location');
      if (location) {
        currentUrl = location;
        // Stop if we've reached a full google.com/maps URL with data
        if (currentUrl.includes('google.com/maps') && currentUrl.includes('/data=')) {
          console.log('Final expanded URL:', currentUrl);
          return currentUrl;
        }
      } else {
        // No more redirects, check response body for meta refresh or JS redirect
        const text = await response.text();
        const metaMatch = text.match(/content=["']0;\s*url=([^"']+)/i);
        const jsMatch = text.match(/window\.location\s*=\s*["']([^"']+)/i);
        const hrefMatch = text.match(/href=["']([^"']*google\.com\/maps[^"']*)/i);

        if (metaMatch) {
          currentUrl = metaMatch[1];
        } else if (jsMatch) {
          currentUrl = jsMatch[1];
        } else if (hrefMatch) {
          currentUrl = hrefMatch[1];
        } else {
          break;
        }
      }
    }
    console.log('Final URL after redirects:', currentUrl);
    return currentUrl;
  } catch (err) {
    console.error('Error expanding URL:', err.message);
    return shortUrl;
  }
}

// Parse Google Maps URL to extract origin/destination coordinates
function parseGoogleMapsUrl(mapsUrl) {
  try {
    const decoded = decodeURIComponent(mapsUrl);
    console.log('Parsing URL:', decoded.substring(0, 200) + '...');

    // Method 1: Extract coordinates from the data parameter
    // Format: !1m5!1m1!1s...!2m2!1d{lng}!2d{lat}
    const coordPattern = /!1m5!1m1!1s[^!]+!2m2!1d([-\d.]+)!2d([-\d.]+)/g;
    const matches = [...decoded.matchAll(coordPattern)];

    if (matches.length >= 2) {
      console.log('Found coordinates via pattern 1');
      return {
        origin: {
          lng: parseFloat(matches[0][1]),
          lat: parseFloat(matches[0][2])
        },
        destination: {
          lng: parseFloat(matches[1][1]),
          lat: parseFloat(matches[1][2])
        }
      };
    }

    // Method 2: Different coordinate format in data param
    // !3d{lat}!4d{lng} pattern
    const altCoordPattern = /!3d([-\d.]+)!4d([-\d.]+)/g;
    const altMatches = [...decoded.matchAll(altCoordPattern)];
    if (altMatches.length >= 2) {
      console.log('Found coordinates via pattern 2');
      return {
        origin: {
          lat: parseFloat(altMatches[0][1]),
          lng: parseFloat(altMatches[0][2])
        },
        destination: {
          lat: parseFloat(altMatches[1][1]),
          lng: parseFloat(altMatches[1][2])
        }
      };
    }

    // Method 3: Extract from @lat,lng in URL
    const viewportMatch = decoded.match(/@([-\d.]+),([-\d.]+)/);

    // Method 4: Try /dir/ format with place names
    const dirMatch = decoded.match(/\/dir\/([^\/]+)\/([^\/]+)/);
    if (dirMatch) {
      const originName = dirMatch[1].replace(/\+/g, ' ').replace(/@.*/, '').trim();
      const destName = dirMatch[2].replace(/\+/g, ' ').replace(/@.*/, '').split('/')[0].trim();
      console.log('Found place names:', originName, '->', destName);
      return {
        originName: originName,
        destinationName: destName
      };
    }

    // Method 5: Look for place IDs that we can reverse geocode later
    const placeIdPattern = /place\/([^\/]+)/g;
    const placeMatches = [...decoded.matchAll(placeIdPattern)];
    if (placeMatches.length >= 2) {
      console.log('Found place names via place path');
      return {
        originName: placeMatches[0][1].replace(/\+/g, ' '),
        destinationName: placeMatches[1][1].replace(/\+/g, ' ')
      };
    }

    console.log('Could not parse URL, no patterns matched');
    return null;
  } catch (e) {
    console.error('URL parse error:', e.message);
    return null;
  }
}

// Decode polyline to array of points
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
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Calculate distance between two points (Haversine)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Find the position of a point along the route (returns index of closest polyline point)
function findPositionAlongRoute(routePoints, lat, lng) {
  let minDist = Infinity;
  let minIndex = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const dist = haversineDistance(lat, lng, routePoints[i].lat, routePoints[i].lng);
    if (dist < minDist) {
      minDist = dist;
      minIndex = i;
    }
  }
  return minIndex;
}

// Sort places by their position along the route
function sortPlacesByRoutePosition(places, encodedPolyline) {
  const routePoints = decodePolyline(encodedPolyline);

  // Calculate route position for each place
  const placesWithPosition = places.map(place => ({
    ...place,
    routePosition: findPositionAlongRoute(routePoints, place.latitude, place.longitude)
  }));

  // Sort by position along route
  placesWithPosition.sort((a, b) => a.routePosition - b.routePosition);

  // Remove the temporary routePosition field
  return placesWithPosition.map(({ routePosition, ...place }) => place);
}

async function geocodeAddress(address) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
  throw new Error(`Could not geocode: ${address}`);
}

async function getRoutePolyline(origin, destination) {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng
        }
      }
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng
        }
      }
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Routes API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return {
    polyline: data.routes[0].polyline.encodedPolyline,
    distanceMeters: data.routes[0].distanceMeters,
    duration: data.routes[0].duration
  };
}

async function searchPlacesAlongRoute(encodedPolyline, searchType) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const queries = {
    gas: 'gas station',
    scenic: 'scenic spot'
  };

  let allPlaces = [];
  let pageToken = null;
  const maxPages = 3; // Up to 60 results per search type

  for (let page = 0; page < maxPages; page++) {
    const requestBody = {
      textQuery: queries[searchType],
      searchAlongRouteParameters: {
        polyline: {
          encodedPolyline: encodedPolyline
        }
      },
      pageSize: 20
    };

    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.reviews,nextPageToken'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Places API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const places = data.places || [];
    allPlaces = allPlaces.concat(places);
    console.log(`  ${searchType} page ${page + 1}: found ${places.length} places (total: ${allPlaces.length})`);

    // Check for next page
    pageToken = data.nextPageToken;
    if (!pageToken) {
      break; // No more pages
    }

    // Small delay before next page request
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allPlaces;
}

async function searchAllPlacesAlongRoute(encodedPolyline) {
  // Search for both gas stations and scenic spots in parallel
  let gasPlaces = [];
  let scenicPlaces = [];

  try {
    [gasPlaces, scenicPlaces] = await Promise.all([
      searchPlacesAlongRoute(encodedPolyline, 'gas'),
      searchPlacesAlongRoute(encodedPolyline, 'scenic')
    ]);
    console.log(`Found ${gasPlaces.length} gas stations, ${scenicPlaces.length} scenic spots`);
  } catch (err) {
    console.error('Error searching places:', err.message);
    // Try them individually if parallel fails
    try { gasPlaces = await searchPlacesAlongRoute(encodedPolyline, 'gas'); } catch (e) { console.error('Gas search failed:', e.message); }
    try { scenicPlaces = await searchPlacesAlongRoute(encodedPolyline, 'scenic'); } catch (e) { console.error('Scenic search failed:', e.message); }
  }

  const formatPlace = (place, category) => {
    const firstReview = place.reviews?.[0]?.text?.text || '';
    return {
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      latitude: place.location?.latitude || null,
      longitude: place.location?.longitude || null,
      phone: place.nationalPhoneNumber || '',
      googleMapsUri: place.googleMapsUri || '',
      rating: place.rating || null,
      reviewCount: place.userRatingCount || 0,
      reviewText: firstReview,
      category: category
    };
  };

  return [
    ...gasPlaces.map(p => formatPlace(p, 'gas')),
    ...scenicPlaces.map(p => formatPlace(p, 'viewpoint'))
  ];
}

function formatDuration(durationString) {
  const seconds = parseInt(durationString.replace('s', ''));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDistance(meters) {
  const km = meters / 1000;
  const miles = km * 0.621371;
  return `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;
}

// HTML page
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gas Station Finder</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; margin-bottom: 20px; }
    .input-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .input-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    input[type="text"] {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .btn-primary {
      background: #4285f4;
      color: white;
    }
    .btn-primary:hover { background: #3367d6; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .btn-danger {
      background: #dc3545;
      color: white;
      padding: 6px 12px;
      font-size: 12px;
    }
    .btn-danger:hover { background: #c82333; }
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    .btn-secondary:hover { background: #5a6268; }
    .route-info {
      background: #e8f4fd;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .route-info h3 { margin: 0 0 10px 0; color: #1a73e8; }
    .route-info p { margin: 5px 0; color: #333; }
    .results {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }
    .results-header h2 { margin: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    tr:hover { background: #f8f9fa; }
    .coords { font-family: monospace; font-size: 12px; color: #666; }
    a { color: #1a73e8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .error {
      background: #fee;
      color: #c00;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .empty {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    .export-btns { display: flex; gap: 10px; }
    #map {
      width: 100%;
      height: 400px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .map-container {
      display: none;
    }
    .marker-label {
      background: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .rating-cell { min-width: 120px; }
    .rating-cell strong { color: #f59e0b; }
    .rating-cell small { color: #666; }
    .rating-cell em { display: block; margin-top: 4px; line-height: 1.3; }
  </style>
</head>
<body>
  <h1>Route POI Finder</h1>

  <div class="input-section">
    <div class="input-row">
      <input type="text" id="routeUrl" placeholder="Paste full Google Maps directions URL" style="flex: 1;">
      <select id="searchType" style="padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
        <option value="gas">Gas Stations</option>
        <option value="scenic">Scenic Spots</option>
      </select>
      <button class="btn-primary" id="searchBtn">Search</button>
    </div>
    <small style="color: #666;">Paste a full Google Maps directions URL (not shortened links). Results ordered from start to finish.</small>
  </div>

  <div id="error" class="error" style="display: none;"></div>
  <div id="loading" class="loading" style="display: none;">
    <p id="loadingText">Searching along route...</p>
  </div>

  <div id="routeInfo" class="route-info" style="display: none;">
    <h3>Route Details</h3>
    <p><strong>From:</strong> <span id="routeOrigin"></span></p>
    <p><strong>To:</strong> <span id="routeDestination"></span></p>
    <p><strong>Distance:</strong> <span id="routeDistance"></span> | <strong>Duration:</strong> <span id="routeDuration"></span></p>
  </div>

  <div id="mapContainer" class="map-container">
    <div id="map"></div>
  </div>

  <div id="results" class="results" style="display: none;">
    <div class="results-header">
      <h2 style="margin: 0;">Results (<span id="placeCount">0</span>)</h2>
      <div class="export-btns">
        <button class="btn-secondary" onclick="exportCSV()">Export CSV</button>
        <button class="btn-secondary" onclick="exportJSON()">Export JSON</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Name</th>
          <th class="rating-cell">Rating</th>
          <th>Address</th>
          <th>Coordinates</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="placesTable"></tbody>
    </table>
  </div>

  <div id="empty" class="empty" style="display: none;">
    <p id="emptyText">No places found along this route.</p>
  </div>

  <script src="https://maps.googleapis.com/maps/api/js?key=__API_KEY__&loading=async&v=weekly"></script>
  <script>
    let allPlaces = [];  // All places from search
    let routeData = null;
    let map = null;
    let markers = [];
    let routeLine = null;
    let infoWindow = null;

    function getFilteredPlaces() {
      return allPlaces;
    }

    // Decode Google's encoded polyline
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
        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
      }
      return points;
    }

    async function searchPlaces() {
      const urlInput = document.getElementById('routeUrl').value.trim();
      const searchType = document.getElementById('searchType').value;
      const btn = document.getElementById('searchBtn');

      if (!urlInput) {
        showError('Please paste a Google Maps directions URL');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Searching...';
      const searchLabel = searchType === 'gas' ? 'gas stations' : 'scenic spots';
      document.getElementById('loadingText').textContent = \`Searching for \${searchLabel} along route...\`;
      hideError();
      document.getElementById('loading').style.display = 'block';
      document.getElementById('results').style.display = 'none';
      document.getElementById('routeInfo').style.display = 'none';
      document.getElementById('mapContainer').style.display = 'none';
      document.getElementById('empty').style.display = 'none';

      try {
        const response = await fetch('/api/gas-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput, searchType: searchType })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to search places');
        }

        routeData = data.route;
        allPlaces = data.places;

        // Update route info
        document.getElementById('routeOrigin').textContent = routeData.origin;
        document.getElementById('routeDestination').textContent = routeData.destination;
        document.getElementById('routeDistance').textContent = routeData.distanceFormatted;
        document.getElementById('routeDuration').textContent = routeData.durationFormatted;
        document.getElementById('routeInfo').style.display = 'block';

        renderPlaces();
        renderMap();

      } catch (err) {
        showError(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Search Route';
        document.getElementById('loading').style.display = 'none';
      }
    }

    function renderMap() {
      const places = getFilteredPlaces();

      if (places.length === 0 && allPlaces.length === 0) {
        document.getElementById('mapContainer').style.display = 'none';
        return;
      }

      document.getElementById('mapContainer').style.display = 'block';

      // Calculate bounds
      const bounds = new google.maps.LatLngBounds();
      places.forEach(place => {
        if (place.latitude && place.longitude) {
          bounds.extend({ lat: place.latitude, lng: place.longitude });
        }
      });

      // Initialize or update map
      if (!map) {
        map = new google.maps.Map(document.getElementById('map'), {
          mapTypeId: 'roadmap'
        });
        infoWindow = new google.maps.InfoWindow();
      }

      // Clear existing markers and route line
      markers.forEach(m => m.setMap(null));
      markers = [];
      if (routeLine) {
        routeLine.setMap(null);
        routeLine = null;
      }

      // Draw route line if we have a polyline
      if (routeData.encodedPolyline) {
        const routePath = decodePolyline(routeData.encodedPolyline);
        routeLine = new google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#4285f4',
          strokeOpacity: 0.8,
          strokeWeight: 4
        });
        routeLine.setMap(map);

        // Extend bounds to include route
        routePath.forEach(point => bounds.extend(point));
      }

      // Add markers for each place
      places.forEach((place, index) => {
        if (!place.latitude || !place.longitude) return;

        // Color based on category: yellow for gas, green for scenic
        const markerColor = place.category === 'gas' ? '#facc15' : '#22c55e';
        const categoryLabel = place.category === 'gas' ? 'Gas Station' : 'Scenic Spot';

        const marker = new google.maps.Marker({
          map: map,
          position: { lat: place.latitude, lng: place.longitude },
          title: place.name,
          label: {
            text: String(index + 1),
            color: '#000',
            fontWeight: 'bold'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          const ratingHtml = place.rating
            ? \`<br><strong>\${place.rating}</strong>/5 (\${place.reviewCount} reviews)\`
            : '';
          const reviewHtml = place.reviewText
            ? \`<br><em style="color:#666; font-size:12px;">"\${place.reviewText.substring(0, 150)}\${place.reviewText.length > 150 ? '...' : ''}"</em>\`
            : '';

          infoWindow.setContent(\`
            <div style="max-width: 280px;">
              <span style="background: \${markerColor}; padding: 2px 6px; border-radius: 3px; font-size: 11px;">\${categoryLabel}</span>
              <br><strong>\${place.name}</strong>\${ratingHtml}
              <br><span style="color: #666;">\${place.address || ''}</span>
              \${place.phone ? '<br>Phone: ' + place.phone : ''}
              \${reviewHtml}
              \${place.googleMapsUri ? '<br><a href="' + place.googleMapsUri + '" target="_blank">View on Google Maps</a>' : ''}
            </div>
          \`);
          infoWindow.open(map, marker);
        });

        markers.push(marker);
      });

      // Fit map to bounds
      map.fitBounds(bounds);
    }

    function renderPlaces() {
      const places = getFilteredPlaces();
      const tbody = document.getElementById('placesTable');
      const countSpan = document.getElementById('placeCount');

      if (allPlaces.length === 0) {
        document.getElementById('results').style.display = 'none';
        document.getElementById('empty').style.display = 'block';
        return;
      }

      document.getElementById('results').style.display = 'block';
      document.getElementById('empty').style.display = 'none';
      countSpan.textContent = allPlaces.length;

      tbody.innerHTML = places.map((place, index) => {
        const ratingHtml = place.rating
          ? \`<strong>\${place.rating}</strong>/5<br><small>(\${place.reviewCount} reviews)</small>\${place.reviewText ? '<br><em>"' + place.reviewText.substring(0, 80) + (place.reviewText.length > 80 ? '...' : '') + '"</em>' : ''}\`
          : '-';

        const categoryColor = place.category === 'gas' ? '#facc15' : '#22c55e';
        const categoryLabel = place.category === 'gas' ? 'Gas' : 'Scenic';

        // Find the actual index in allPlaces for delete
        const allIndex = allPlaces.indexOf(place);

        return \`
        <tr data-index="\${index}" onclick="panToPlace(\${index})" style="cursor: pointer;">
          <td>\${index + 1}</td>
          <td><span style="background: \${categoryColor}; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">\${categoryLabel}</span></td>
          <td>
            \${place.googleMapsUri
              ? \`<a href="\${place.googleMapsUri}" target="_blank" onclick="event.stopPropagation();">\${place.name}</a>\`
              : place.name}
          </td>
          <td class="rating-cell">\${ratingHtml}</td>
          <td>\${place.address || '-'}</td>
          <td class="coords">\${place.latitude?.toFixed(6)}, \${place.longitude?.toFixed(6)}</td>
          <td>
            <button class="btn-danger" onclick="event.stopPropagation(); deletePlace(\${allIndex})">Delete</button>
          </td>
        </tr>
      \`;
      }).join('');

      // Also update the map
      renderMap();
    }

    function panToPlace(index) {
      const places = getFilteredPlaces();
      const place = places[index];
      if (map && place && place.latitude && place.longitude) {
        map.panTo({ lat: place.latitude, lng: place.longitude });
        map.setZoom(14);
        // Trigger click on marker to show info window
        if (markers[index]) {
          google.maps.event.trigger(markers[index], 'click');
        }
      }
    }

    function deletePlace(index) {
      allPlaces.splice(index, 1);
      renderPlaces();
      // renderMap is called by renderPlaces
    }

    function showError(message) {
      const el = document.getElementById('error');
      el.textContent = message;
      el.style.display = 'block';
    }

    function hideError() {
      document.getElementById('error').style.display = 'none';
    }

    function getFilename(extension) {
      // Use destination name for filename
      const dest = routeData?.destination || 'route';
      const sanitized = dest.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\\s-]/g, '').replace(/\\s+/g, '-').toLowerCase();
      return \`\${sanitized}-pois.\${extension}\`;
    }

    function exportCSV() {
      if (allPlaces.length === 0) return;

      const gasCount = allPlaces.filter(p => p.category === 'gas').length;
      const scenicCount = allPlaces.filter(p => p.category === 'viewpoint').length;

      // Add route info as header comments
      const routeInfo = [
        \`# Route: \${routeData.origin} to \${routeData.destination}\`,
        \`# Total POIs: \${allPlaces.length} (Gas: \${gasCount}, Scenic: \${scenicCount})\`,
        \`# Distance: \${routeData.distanceFormatted}\`,
        \`# Duration: \${routeData.durationFormatted}\`,
        ''
      ];

      const headers = ['Category', 'Name', 'Rating', 'Reviews', 'Address', 'Latitude', 'Longitude', 'Phone', 'Review Text', 'Google Maps Link'];
      const rows = allPlaces.map(s => [
        s.category === 'gas' ? 'Gas Station' : 'Scenic Spot',
        '"' + (s.name || '').replace(/"/g, '""') + '"',
        s.rating || '',
        s.reviewCount || 0,
        '"' + (s.address || '').replace(/"/g, '""') + '"',
        s.latitude,
        s.longitude,
        '"' + (s.phone || '').replace(/"/g, '""') + '"',
        '"' + (s.reviewText || '').replace(/"/g, '""') + '"',
        '"' + (s.googleMapsUri || '').replace(/"/g, '""') + '"'
      ]);

      const csv = [...routeInfo, headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
      downloadFile(getFilename('csv'), csv, 'text/csv');
    }

    function exportJSON() {
      if (allPlaces.length === 0) return;

      const data = {
        route: {
          from: routeData.origin,
          to: routeData.destination,
          distance: routeData.distanceFormatted,
          duration: routeData.durationFormatted
        },
        pois: allPlaces.map((s, index) => ({
          id: \`\${s.category}-\${Date.now()}-\${index}\`,
          name: s.name,
          coordinates: {
            lat: s.latitude,
            lng: s.longitude
          },
          category: s.category,
          description: s.address || '',
          phone: s.phone || undefined,
          hours: undefined
        }))
      };
      downloadFile(getFilename('json'), JSON.stringify(data, null, 2), 'application/json');
    }

    function downloadFile(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initialize event listeners when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('searchBtn').addEventListener('click', searchPlaces);
    });

    // Also expose to window for any inline handlers
    window.searchPlaces = searchPlaces;
    window.renderPlaces = renderPlaces;
    window.panToPlace = panToPlace;
    window.deletePlace = deletePlace;
    window.exportCSV = exportCSV;
    window.exportJSON = exportJSON;
  </script>
</body>
</html>`;

// Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = parseUrl(req.url, true);

  // Serve HTML page
  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_PAGE.replace('__API_KEY__', API_KEY));
    return;
  }

  // API endpoint
  if (parsedUrl.pathname === '/api/gas-stations' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { url: mapsUrl, searchType = 'gas' } = JSON.parse(body);

        if (!mapsUrl || !mapsUrl.trim()) {
          throw new Error('Please paste a Google Maps directions URL');
        }

        console.log('=== Processing Request ===');
        console.log('Search type:', searchType);
        console.log('URL:', mapsUrl.substring(0, 100) + '...');

        // Parse the Google Maps URL
        const parsed = parseGoogleMapsUrl(mapsUrl.trim());
        console.log('Parsed:', JSON.stringify(parsed, null, 2));

        if (!parsed) {
          throw new Error('Could not parse URL. Make sure it\'s a Google Maps directions URL.');
        }

        let origin, destination;

        if (parsed.origin && parsed.destination) {
          origin = { ...parsed.origin, name: `${parsed.origin.lat.toFixed(4)}, ${parsed.origin.lng.toFixed(4)}` };
          destination = { ...parsed.destination, name: `${parsed.destination.lat.toFixed(4)}, ${parsed.destination.lng.toFixed(4)}` };
        } else if (parsed.originName && parsed.destinationName) {
          console.log('Geocoding:', parsed.originName, '->', parsed.destinationName);
          const originCoords = await geocodeAddress(parsed.originName);
          const destCoords = await geocodeAddress(parsed.destinationName);
          origin = { ...originCoords, name: parsed.originName };
          destination = { ...destCoords, name: parsed.destinationName };
        } else {
          throw new Error('Could not extract origin and destination from URL');
        }

        console.log('Route:', origin.name, '->', destination.name);

        // Get route
        const routeData = await getRoutePolyline(origin, destination);

        // Search for selected type along route
        console.log('Searching for:', searchType);
        const rawPlaces = await searchPlacesAlongRoute(routeData.polyline, searchType);

        // Format places
        const category = searchType === 'gas' ? 'gas' : 'viewpoint';
        const placesList = rawPlaces.map(place => {
          const firstReview = place.reviews?.[0]?.text?.text || '';
          return {
            name: place.displayName?.text || 'Unknown',
            address: place.formattedAddress || '',
            latitude: place.location?.latitude || null,
            longitude: place.location?.longitude || null,
            phone: place.nationalPhoneNumber || '',
            googleMapsUri: place.googleMapsUri || '',
            rating: place.rating || null,
            reviewCount: place.userRatingCount || 0,
            reviewText: firstReview,
            category: category
          };
        });
        console.log('Found', placesList.length, 'places');

        // Sort places by position along route (start to finish)
        const sortedPlaces = sortPlacesByRoutePosition(placesList, routeData.polyline);
        console.log('Sorted places by route position');

        const result = {
          route: {
            origin: origin.name,
            destination: destination.name,
            distanceMeters: routeData.distanceMeters,
            distanceFormatted: formatDistance(routeData.distanceMeters),
            duration: routeData.duration,
            durationFormatted: formatDuration(routeData.duration),
            encodedPolyline: routeData.polyline
          },
          places: sortedPlaces
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (err) {
        console.error('API Error:', err.message);
        console.error(err.stack);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

// Start server
if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
  console.error('Usage: export GOOGLE_MAPS_API_KEY="your-key-here"');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Gas Station Finder running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
