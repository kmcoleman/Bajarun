#!/usr/bin/env node

/**
 * Find Gas Stations Along Route
 *
 * Uses Google Routes API and Places API (New) to find gas stations
 * along a specified route.
 *
 * Usage:
 *   export GOOGLE_MAPS_API_KEY="your-key-here"
 *   node find-gas-stations.js
 *   node find-gas-stations.js "Origin Address" "Destination Address"
 */

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Default route: Mulegé to Bahía de los Ángeles
const DEFAULT_ORIGIN = {
  name: "Mulegé, BCS, Mexico",
  lat: 26.8922164,
  lng: -111.9835831
};

const DEFAULT_DESTINATION = {
  name: "Bahía de los Ángeles, Baja California, Mexico",
  lat: 28.9519153,
  lng: -113.5624339
};

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

async function searchGasStationsAlongRoute(encodedPolyline) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const requestBody = {
    textQuery: "gas station",
    searchAlongRouteParameters: {
      polyline: {
        encodedPolyline: encodedPolyline
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Places API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.places || [];
}

function formatDuration(durationString) {
  // Duration comes as "12345s" format
  const seconds = parseInt(durationString.replace('s', ''));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDistance(meters) {
  const km = meters / 1000;
  const miles = km * 0.621371;
  return `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;
}

function generateCSV(gasStations) {
  const headers = ['Name', 'Address', 'Latitude', 'Longitude', 'Phone', 'Google Maps Link'];
  const rows = gasStations.map(station => [
    `"${(station.name || '').replace(/"/g, '""')}"`,
    `"${(station.address || '').replace(/"/g, '""')}"`,
    station.latitude,
    station.longitude,
    `"${(station.phone || '').replace(/"/g, '""')}"`,
    `"${(station.googleMapsUri || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

async function main() {
  if (!API_KEY) {
    console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
    console.error('Usage: export GOOGLE_MAPS_API_KEY="your-key-here"');
    process.exit(1);
  }

  // Use command line args or defaults
  const origin = DEFAULT_ORIGIN;
  const destination = DEFAULT_DESTINATION;

  console.log('Finding gas stations along route...');
  console.log(`  From: ${origin.name}`);
  console.log(`  To:   ${destination.name}`);
  console.log('');

  try {
    // Step 1: Get route polyline
    console.log('Step 1: Fetching route from Google Routes API...');
    const routeData = await getRoutePolyline(origin, destination);
    console.log(`  Distance: ${formatDistance(routeData.distanceMeters)}`);
    console.log(`  Duration: ${formatDuration(routeData.duration)}`);
    console.log('');

    // Step 2: Search for gas stations along route
    console.log('Step 2: Searching for gas stations along route...');
    const places = await searchGasStationsAlongRoute(routeData.polyline);
    console.log(`  Found ${places.length} gas stations`);
    console.log('');

    // Format results
    const gasStations = places.map(place => ({
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      latitude: place.location?.latitude || null,
      longitude: place.location?.longitude || null,
      phone: place.nationalPhoneNumber || '',
      googleMapsUri: place.googleMapsUri || ''
    }));

    const result = {
      route: {
        origin: origin.name,
        destination: destination.name,
        distanceMeters: routeData.distanceMeters,
        distanceFormatted: formatDistance(routeData.distanceMeters),
        duration: routeData.duration,
        durationFormatted: formatDuration(routeData.duration)
      },
      gasStations: gasStations
    };

    // Output JSON
    console.log('=== JSON Output ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    // Output CSV
    console.log('=== CSV Output ===');
    console.log(generateCSV(gasStations));
    console.log('');

    // Summary table
    console.log('=== Gas Stations Summary ===');
    gasStations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   Address: ${station.address}`);
      console.log(`   GPS: ${station.latitude}, ${station.longitude}`);
      if (station.phone) {
        console.log(`   Phone: ${station.phone}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
