/**
 * itinerary.ts
 *
 * Itinerary data for the Baja Tour.
 * March 19-27, 2026
 *
 * Route: El Cajon, CA → Baja California → Death Valley
 */

export interface AccommodationLink {
  name: string;
  url: string;
  type: 'camping' | 'hotel';
}

export interface DayItinerary {
  day: number;
  date: string;
  title: string;
  description: string;
  miles: number;
  ridingTime: string;
  startPoint: string;
  endPoint: string;
  accommodation: string;
  accommodationType: 'hotel' | 'camping' | 'mixed';
  accommodationLinks?: AccommodationLink[];
  pointsOfInterest: string[];
  coordinates: {
    start: [number, number]; // [lat, lng]
    end: [number, number];
  };
}

export const itineraryData: DayItinerary[] = [
  {
    day: 1,
    date: "March 19, 2026",
    title: "Arrival & Meet in El Cajon",
    description: "Riders arrive and gather in El Cajon, California for orientation, bike checks, and welcome dinner. We'll review the route, safety protocols, and get to know fellow riders before heading south.",
    miles: 0,
    ridingTime: "N/A",
    startPoint: "El Cajon, CA",
    endPoint: "El Cajon, CA",
    accommodation: "Best Western Plus La Mesa (~$90 PP double occupancy)",
    accommodationType: 'hotel',
    accommodationLinks: [
      { name: "Best Western Plus La Mesa", url: "https://www.bestwestern.com/en_US/book/hotel-rooms.05721.html", type: "hotel" }
    ],
    pointsOfInterest: [
      "Welcome dinner and orientation",
      "Bike inspection and preparation",
      "Route briefing and safety review",
      "Document check (passport, insurance, registration)"
    ],
    coordinates: {
      start: [32.7948, -116.9625],
      end: [32.7948, -116.9625]
    }
  },
  {
    day: 2,
    date: "March 20, 2026",
    title: "El Cajon to Rancho Meling",
    description: "Cross the Mexican border at Tecate and ride south through the beautiful Valle de Guadalupe wine country. End the day at the legendary Rancho Meling, a working cattle ranch in the Sierra San Pedro Mártir.",
    miles: 207,
    ridingTime: "4.5 hours",
    startPoint: "El Cajon, CA",
    endPoint: "Rancho Meling, BC",
    accommodation: "Shared Room ($75-100 PP double) or Camping ($15)",
    accommodationType: 'mixed',
    accommodationLinks: [
      { name: "Rancho Meling", url: "https://ranchomeling.staydirectly.com", type: "hotel" }
    ],
    pointsOfInterest: [
      "Tecate border crossing",
      "Valle de Guadalupe wine country",
      "Sierra San Pedro Mártir views",
      "Historic Rancho Meling (est. 1893)",
      "Ranch-style dinner"
    ],
    coordinates: {
      start: [32.7948, -116.9625],
      end: [30.9667, -115.7500]
    }
  },
  {
    day: 3,
    date: "March 21, 2026",
    title: "Rancho Meling to Laguna Ojo de Liebre",
    description: "Big riding day south through the Vizcaíno Desert to Guerrero Negro area. Camp at the famous Laguna Ojo de Liebre whale sanctuary where gray whales come to breed and give birth.",
    miles: 343,
    ridingTime: "7 hours",
    startPoint: "Rancho Meling, BC",
    endPoint: "Laguna Ojo de Liebre, BCS",
    accommodation: "Rustic Camping at Whale Preserve ($15)",
    accommodationType: 'camping',
    pointsOfInterest: [
      "Vizcaíno Desert landscapes",
      "28th Parallel - Baja California Sur border",
      "Salt evaporation ponds",
      "Laguna Ojo de Liebre whale sanctuary",
      "Gray whale watching (seasonal)"
    ],
    coordinates: {
      start: [30.9667, -115.7500],
      end: [27.7500, -114.0333]
    }
  },
  {
    day: 4,
    date: "March 22, 2026",
    title: "Laguna Ojo de Liebre to Mulegé",
    description: "Ride to the charming oasis town of Mulegé on the Sea of Cortez. Choose between a hotel in town or camping on the stunning beaches of Bahía Concepción.",
    miles: 181,
    ridingTime: "3.75 hours",
    startPoint: "Laguna Ojo de Liebre, BCS",
    endPoint: "Mulegé, BCS",
    accommodation: "Hotel in Mulegé or Camping on Bahía Concepción",
    accommodationType: 'mixed',
    pointsOfInterest: [
      "San Ignacio oasis and mission",
      "Sea of Cortez first views",
      "Mulegé river and palm groves",
      "Historic Mission Santa Rosalía de Mulegé",
      "Bahía Concepción beaches"
    ],
    coordinates: {
      start: [27.7500, -114.0333],
      end: [26.8833, -111.9833]
    }
  },
  {
    day: 5,
    date: "March 23, 2026",
    title: "Mulegé to Bahía de los Ángeles",
    description: "Head north along the Sea of Cortez to the remote fishing village of Bahía de los Ángeles. This isolated bay offers incredible scenery and a true Baja adventure experience.",
    miles: 311,
    ridingTime: "6 hours",
    startPoint: "Mulegé, BCS",
    endPoint: "Bahía de los Ángeles, BC",
    accommodation: "Camp Archelon or Los Vientos Hotel ($50-90 PP double)",
    accommodationType: 'mixed',
    accommodationLinks: [
      { name: "Camp Archelon", url: "https://www.campoarchelon.com/about-us/", type: "camping" },
      { name: "Los Vientos Hotel", url: "https://www.hotelsone.com/bahia-de-los-angeles-hotels-mx/los-vientos-hotel.html", type: "hotel" }
    ],
    pointsOfInterest: [
      "Coastal Highway 1 scenery",
      "Remote desert landscapes",
      "Bahía de los Ángeles bay views",
      "Island views in the Sea of Cortez",
      "Camp Archelon sea turtle conservation"
    ],
    coordinates: {
      start: [26.8833, -111.9833],
      end: [28.9500, -113.5500]
    }
  },
  {
    day: 6,
    date: "March 24, 2026",
    title: "Bahía de los Ángeles - Rest Day",
    description: "Rest day in Bahía de los Ángeles. Explore the bay, go fishing, visit the islands, or simply relax. This is one of Baja's most beautiful and remote locations.",
    miles: 0,
    ridingTime: "Rest day",
    startPoint: "Bahía de los Ángeles, BC",
    endPoint: "Bahía de los Ángeles, BC",
    accommodation: "Camp Archelon or Los Vientos Hotel ($50-90 PP double)",
    accommodationType: 'mixed',
    accommodationLinks: [
      { name: "Camp Archelon", url: "https://www.campoarchelon.com/about-us/", type: "camping" },
      { name: "Los Vientos Hotel", url: "https://www.hotelsone.com/bahia-de-los-angeles-hotels-mx/los-vientos-hotel.html", type: "hotel" }
    ],
    pointsOfInterest: [
      "Fishing excursions available",
      "Island boat tours",
      "Sea turtle conservation center",
      "Snorkeling and kayaking",
      "Stargazing (minimal light pollution)",
      "Local seafood restaurants"
    ],
    coordinates: {
      start: [28.9500, -113.5500],
      end: [28.9500, -113.5500]
    }
  },
  {
    day: 7,
    date: "March 25, 2026",
    title: "Bahía de los Ángeles to San Felipe",
    description: "Ride north to the beach town of San Felipe on the upper Sea of Cortez. Known for its massive tidal changes and shrimp fishing, San Felipe marks our return toward the border.",
    miles: 202,
    ridingTime: "3.75 hours",
    startPoint: "Bahía de los Ángeles, BC",
    endPoint: "San Felipe, BC",
    accommodation: "Hotel or Camping Option",
    accommodationType: 'mixed',
    pointsOfInterest: [
      "Desert highway scenery",
      "Puertecitos hot springs area",
      "San Felipe malecón (boardwalk)",
      "Fresh shrimp dinner",
      "Dramatic tidal flats"
    ],
    coordinates: {
      start: [28.9500, -113.5500],
      end: [31.0250, -114.8500]
    }
  },
  {
    day: 8,
    date: "March 26, 2026",
    title: "San Felipe to Julian",
    description: "Cross back into the USA and enjoy an excellent ride through Cleveland National Forest to the historic gold mining town of Julian, famous for its apple pies.",
    miles: 428,
    ridingTime: "8 hours",
    startPoint: "San Felipe, BC",
    endPoint: "Julian, CA",
    accommodation: "Hotel TBD (expect $80-125 PP double occupancy)",
    accommodationType: 'hotel',
    pointsOfInterest: [
      "Mexicali border crossing",
      "Imperial Valley views",
      "Anza-Borrego Desert State Park",
      "Cleveland National Forest twisties",
      "Julian historic downtown",
      "Famous Julian apple pie"
    ],
    coordinates: {
      start: [31.0250, -114.8500],
      end: [33.0786, -116.6019]
    }
  },
  {
    day: 9,
    date: "March 27, 2026",
    title: "Julian to Furnace Creek",
    description: "Final epic riding day through Joshua Tree National Park and the Mojave Desert to Death Valley. End the adventure camping at Furnace Creek with a farewell celebration.",
    miles: 380,
    ridingTime: "7 hours",
    startPoint: "Julian, CA",
    endPoint: "Furnace Creek, Death Valley",
    accommodation: "Camping at Furnace Creek",
    accommodationType: 'camping',
    pointsOfInterest: [
      "Salton Sea views",
      "Joshua Tree National Park",
      "Mojave Desert landscapes",
      "Death Valley National Park entrance",
      "Badwater Basin (lowest point in N. America)",
      "Farewell dinner under the stars"
    ],
    coordinates: {
      start: [33.0786, -116.6019],
      end: [36.4572, -116.8658]
    }
  }
];

// Calculate total miles
export const totalMiles = itineraryData.reduce((sum, day) => sum + day.miles, 0);

// Trip summary
export const tripSummary = {
  startDate: "March 19, 2026",
  endDate: "March 27, 2026",
  totalDays: 9,
  ridingDays: 7,
  restDays: 2,
  totalMiles,
  startLocation: "El Cajon, California",
  endLocation: "Furnace Creek, Death Valley",
  countries: ["USA", "Mexico"]
};
