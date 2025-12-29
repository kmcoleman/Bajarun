#!/usr/bin/env node

/**
 * Baja Route Planner Server
 *
 * Serves the route planner UI and proxies Google API calls.
 *
 * Usage:
 *   export GOOGLE_MAPS_API_KEY="your-key-here"
 *   node server.js
 *   Open http://localhost:3457
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PORT = 3457;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

// Serve static files
function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not Found');
  }
}

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

// Geocode an address to coordinates
async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
  }
  throw new Error(`Could not geocode: ${address}`);
}

// Search for places along a route
async function searchPlacesAlongRoute(encodedPolyline, query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  let allPlaces = [];
  let pageToken = null;
  const maxPages = 3;

  for (let page = 0; page < maxPages; page++) {
    const requestBody = {
      textQuery: query,
      searchAlongRouteParameters: {
        polyline: { encodedPolyline }
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
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.rating,places.userRatingCount,nextPageToken'
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

    pageToken = data.nextPageToken;
    if (!pageToken) break;

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allPlaces.map(place => ({
    id: place.id,
    name: place.displayName?.text || 'Unknown',
    address: place.formattedAddress || '',
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    phone: place.nationalPhoneNumber || '',
    rating: place.rating || null,
    reviewCount: place.userRatingCount || 0
  }));
}

// Get route from Google Routes API
async function getRoute(origin, destination, waypoints = []) {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const intermediates = waypoints.map(wp => ({
    location: { latLng: { latitude: wp.lat, longitude: wp.lng } }
  }));

  const requestBody = {
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } }
    },
    destination: {
      location: { latLng: { latitude: destination.lat, longitude: destination.lng } }
    },
    intermediates,
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE'
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

  const route = data.routes[0];
  const distanceKm = route.distanceMeters / 1000;
  const distanceMiles = distanceKm * 0.621371;
  const durationSec = parseInt(route.duration.replace('s', ''));
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);

  return {
    polyline: route.polyline.encodedPolyline,
    distanceMeters: route.distanceMeters,
    distanceMiles: Math.round(distanceMiles),
    duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  };
}

// Parse Google Maps URL to extract place info
function parseGoogleMapsUrl(url) {
  try {
    const decoded = decodeURIComponent(url);

    // Extract coordinates: @lat,lng or !3dlat!4dlng
    let lat, lng, name;

    // Try @lat,lng format
    const atMatch = decoded.match(/@([-\d.]+),([-\d.]+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Try !3d!4d format
    const dataMatch = decoded.match(/!3d([-\d.]+)!4d([-\d.]+)/);
    if (dataMatch) {
      lat = parseFloat(dataMatch[1]);
      lng = parseFloat(dataMatch[2]);
    }

    // Extract place name from /place/ path
    const placeMatch = decoded.match(/\/place\/([^\/]+)/);
    if (placeMatch) {
      name = placeMatch[1].replace(/\+/g, ' ');
    }

    if (lat && lng) {
      return { lat, lng, name: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }

    return null;
  } catch (e) {
    return null;
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers for API routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Static files
    if (req.method === 'GET') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        serveStatic(res, path.join(__dirname, 'index.html'));
        return;
      }
      if (url.pathname === '/app.js') {
        serveStatic(res, path.join(__dirname, 'app.js'));
        return;
      }
      if (url.pathname === '/style.css') {
        serveStatic(res, path.join(__dirname, 'style.css'));
        return;
      }
    }

    // API: Geocode
    if (url.pathname === '/api/geocode' && req.method === 'POST') {
      const { address } = await parseBody(req);
      const result = await geocodeAddress(address);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // API: Get Route
    if (url.pathname === '/api/route' && req.method === 'POST') {
      const { origin, destination, waypoints } = await parseBody(req);
      const result = await getRoute(origin, destination, waypoints || []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // API: Search Places
    if (url.pathname === '/api/search' && req.method === 'POST') {
      const { polyline, query } = await parseBody(req);
      const results = await searchPlacesAlongRoute(polyline, query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
      return;
    }

    // API: Parse Google URL
    if (url.pathname === '/api/parse-url' && req.method === 'POST') {
      const { url: mapsUrl } = await parseBody(req);
      const result = parseGoogleMapsUrl(mapsUrl);
      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not parse URL' }));
      }
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');

  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// Start server
if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Baja Route Planner running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
