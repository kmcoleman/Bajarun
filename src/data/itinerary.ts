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
  waypoints?: [number, number][]; // Optional intermediate waypoints [lat, lng]
}

export const itineraryData: DayItinerary[] = [
  {
    day: 1,
    date: "March 19, 2026",
    title: "Arrival & Meet in Temecula",
    description: "Riders make their way to Temecula, California on their own to meet up for orientation, bike checks, and welcome dinner. We'll review the route, safety protocols, and get to know fellow riders before heading south together.",
    miles: 0,
    ridingTime: "N/A",
    startPoint: "Temecula, CA",
    endPoint: "Temecula, CA",
    accommodation: "Best Western Plus Temecula",
    accommodationType: 'hotel',
    accommodationLinks: [
      { name: "Best Western Plus Temecula", url: "https://bestwesternplustemecula.bookonline.com/hotel/best-western-plus-temecula-wine-country-hotel-&suites?id2=129193716631", type: "hotel" }
    ],
    pointsOfInterest: [
      "Welcome dinner and orientation",
      "Bike inspection and preparation",
      "Route briefing and safety review",
      "Document check (passport, insurance, registration)"
    ],
    coordinates: {
      start: [33.4936, -117.1484],
      end: [33.4936, -117.1484]
    }
  },
  {
    day: 2,
    date: "March 20, 2026",
    title: "Temecula to Rancho Meling",
    description: "This journey begins in the rolling vineyards of Temecula, climbing through the scenic mountain twisties of San Diego County before crossing the border at the relaxed, high-altitude Tecate gate. Once in Mexico, you'll head south on Highway 3 through the world-class wineries of the Valle de Guadalupe and into the rugged ranch lands of the Sierra de San Pedro Mártir. The ride concludes at the historic Rancho Meling, a 10,000-acre working cattle ranch nestled in an oak-dotted valley at the foot of Baja's highest peaks.",
    miles: 273,
    ridingTime: "6 hours",
    startPoint: "Temecula, CA",
    endPoint: "Rancho Meling, BC",
    accommodation: "Shared Room ($55-70 PP) or Camping ($15)",
    accommodationType: 'mixed',
    accommodationLinks: [
      { name: "Rancho Meling", url: "https://ranchomeling.staydirectly.com", type: "hotel" }
    ],
    pointsOfInterest: [
      "Tecate Border Crossing: Less-congested alternative to Tijuana into Baja's mountain scenery",
      "Valle de Guadalupe: The Napa Valley of Mexico with stunning vineyard vistas",
      "Ensenada Malecon: Vibrant waterfront boardwalk with massive Mexican flag",
      "Hussong's Cantina: Oldest cantina in Baja (est. 1892), birthplace of the Margarita",
      "La Bufadora: Marine geyser shooting seawater over 100 feet into the air",
      "Ojos Negros: Traditional ranching community famous for artisanal cheeses"
    ],
    coordinates: {
      start: [33.4936, -117.1484],
      end: [30.9667, -115.7500]
    },
    waypoints: [
      [32.576815, -116.627541]
    ]
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
    title: "Laguna Ojo de Liebre to Playa El Burro",
    description: "Leaving the Pacific salt flats of Ojo de Liebre, you will traverse the vast Vizcaíno Desert before ascending the volcanic switchbacks of the Cuesta del Infierno. The route then transforms into a lush river valley oasis at Mulegé, finally opening up to the jaw-dropping turquoise waters and white sand beaches of Bahía Concepción. This ride captures the best of Baja's contrast, shifting from stark, sun-bleached plains to a world-class coastline dotted with secluded palapas.",
    miles: 197,
    ridingTime: "4.25 hours",
    startPoint: "Laguna Ojo de Liebre, BCS",
    endPoint: "Playa El Burro, BCS",
    accommodation: "Beach Camping at Playa El Burro",
    accommodationType: 'camping',
    pointsOfInterest: [
      "Guerrero Negro Salt Works: Largest sea salt evaporative pond in the world",
      "San Ignacio Oasis: Palm-fringed town with stunning 18th-century stone mission",
      "Volcán Las Tres Vírgenes: Towering dormant volcanoes near the Sea of Cortez",
      "Cuesta del Infierno: Thrilling steep switchbacks dropping to the coast",
      "Santa Rosalía: French-influenced mining town with Eiffel-designed iron church",
      "Panaderia El Boleo: Century-old bakery famous for French-style breads",
      "Mulegé River Overlook: Panoramic view of palm oasis meeting the sea"
    ],
    coordinates: {
      start: [27.7500, -114.0333],
      end: [26.729599, -111.907063]
    }
  },
  {
    day: 5,
    date: "March 23, 2026",
    title: "Bahía Concepción - Rest Day",
    description: "Rest day to explore the stunning beaches and coves of Bahía Concepción. Relax on the beach, take a short 30-minute ride into the charming town of Mulegé, or venture on a longer 90-minute ride south to the beautiful colonial town of Loreto. For the adventurous, a 2.25-hour ride inland takes you to the historic Mission San Javier, one of the best-preserved missions in Baja. Lots to do on your free day!",
    miles: 0,
    ridingTime: "Rest day",
    startPoint: "Playa El Burro, BCS",
    endPoint: "Playa El Burro, BCS",
    accommodation: "Beach Camping at Playa El Burro",
    accommodationType: 'camping',
    pointsOfInterest: [
      "Kayaking and snorkeling in crystal-clear waters",
      "Explore nearby beaches: Playa Santispac, Playa Coyote, Playa Requeson",
      "Visit the historic town of Mulegé (30 min ride)",
      "Visit the town of Loreto or head up to the historic Mission San Javier",
      "Fresh seafood at beachside palapas",
      "Optional: Cave paintings tour at Sierra de Guadalupe"
    ],
    coordinates: {
      start: [26.729599, -111.907063],
      end: [26.729599, -111.907063]
    }
  },
  {
    day: 6,
    date: "March 24, 2026",
    title: "Playa El Burro to Bahía de los Ángeles",
    description: "Head north along the Sea of Cortez to the remote fishing village of Bahía de los Ángeles. This isolated bay offers incredible scenery and a true Baja adventure experience. The route takes you back through Mulegé and north on Highway 1 before turning east on the scenic Highway 12 that winds through dramatic desert landscapes to the coast.",
    miles: 311,
    ridingTime: "6.5 hours",
    startPoint: "Playa El Burro, BCS",
    endPoint: "Bahía de los Ángeles, BC",
    accommodation: "Camp Archelon or Los Vientos Hotel ($50-90 PP double)",
    accommodationType: 'mixed',
    accommodationLinks: [
      { name: "Camp Archelon", url: "https://www.campoarchelon.com/about-us/", type: "camping" },
      { name: "Los Vientos Hotel", url: "https://www.hotelsone.com/bahia-de-los-angeles-hotels-mx/los-vientos-hotel.html", type: "hotel" }
    ],
    pointsOfInterest: [
      "Coastal Highway 1 scenery",
      "Remote desert landscapes on Highway 12",
      "Bahía de los Ángeles bay views",
      "Island views in the Sea of Cortez",
      "Camp Archelon sea turtle conservation"
    ],
    coordinates: {
      start: [26.729599, -111.907063],
      end: [28.9500, -113.5500]
    }
  },
  {
    day: 7,
    date: "March 25, 2026",
    title: "Bahía de los Ángeles to Tecate",
    description: "Traveling via Highway 5 offers a stunningly paved alternative to the interior route, following the dramatic coastline of the Sea of Cortez through some of Baja's most pristine landscapes. You will ride through the turquoise vistas of Gonzaga Bay and the winding mountain passes near Puertecitos before reaching the lively, sandy shores of San Felipe. The final leg transitions from the desert floor into the high-altitude curves of the Sierra de Juárez, delivering you into the temperate wine country and the cooler mountain air of the Tecate border. For our last night in Mexico, we will be staying in style at a 4-star hotel with pool, hot tub, spa, and more.",
    miles: 390,
    ridingTime: "7.5 hours",
    startPoint: "Bahía de los Ángeles, BC",
    endPoint: "Tecate, BC",
    accommodation: "Santuario Diegueño",
    accommodationType: 'hotel',
    accommodationLinks: [
      { name: "Santuario Diegueño", url: "https://santuariodiegueno.com/en/", type: "hotel" }
    ],
    pointsOfInterest: [
      "Gonzaga Bay",
      "The Puertecitos Twisties",
      "Valley of the Giants",
      "La Rumorosa Grade",
      "San Felipe Malecon"
    ],
    coordinates: {
      start: [28.9500, -113.5500],
      end: [32.576069, -116.619630]
    }
  },
  {
    day: 8,
    date: "March 26, 2026",
    title: "Tecate to Twentynine Palms",
    description: "Crossing the border into California, you will climb through the twisty mountain pines of Julian and the sweeping vistas of the Sunrise Scenic Byway before descending into the vast Anza-Borrego Desert. The route then leads you north into the Mojave, where you'll navigate the surreal rock formations and iconic Joshua Tree forests that define the national park's unique landscape. It is a diverse ride that transitions from high-altitude alpine curves to wide-open desert plains, ending at the rugged gateway of Twentynine Palms.",
    miles: 200,
    ridingTime: "4.25 hours",
    startPoint: "Tecate, BC",
    endPoint: "Twentynine Palms, CA",
    accommodation: "Fairfield Inn & Suites Twentynine Palms",
    accommodationType: 'hotel',
    accommodationLinks: [
      { name: "Fairfield Inn & Suites Twentynine Palms", url: "https://www.marriott.com/hotels/travel/pspfi-fairfield-inn-and-suites-twentynine-palms-joshua-tree-national-park/", type: "hotel" }
    ],
    pointsOfInterest: [
      "Julian: Historic gold-mining charm and legendary apple pies",
      "Sunrise Scenic Byway: High-elevation sweepers through Cleveland National Forest",
      "Anza-Borrego Desert State Park: Badlands and Sky Art sculptures",
      "Box Canyon Road: Dramatic narrow passage through colorful rock layers",
      "Joshua Tree National Park: Rock monoliths and iconic Joshua trees"
    ],
    coordinates: {
      start: [32.576069, -116.619630],
      end: [34.1356, -116.0542]
    },
    waypoints: [
      [33.076266, -116.598577]
    ]
  },
  {
    day: 9,
    date: "March 27, 2026",
    title: "Twentynine Palms to Furnace Creek",
    description: "This route takes you from the high desert of Twentynine Palms into the heart of the Mojave National Preserve, where the paved road cuts through a silent, prehistoric landscape of cinder cones and vast sand dunes. You will traverse the iconic Mojave Road, passing through the historic railroad ghost town of Kelso before descending into the dramatic, sun-scorched basin of Death Valley. The ride culminates in a spectacular drop into Furnace Creek, an oasis surrounded by vibrant badlands and the lowest elevations in North America.",
    miles: 240,
    ridingTime: "4 hours",
    startPoint: "Twentynine Palms, CA",
    endPoint: "Furnace Creek, Death Valley",
    accommodation: "Camping at Furnace Creek",
    accommodationType: 'camping',
    pointsOfInterest: [
      "Amboy Road & Ironage: Desolate desert straightaway with wide-open horizons",
      "Kelso Depot: Restored 1924 Spanish-style train station and visitor center",
      "Kelso Dunes: Massive singing sand dunes rising 600+ feet",
      "Mojave Cinder Cones: Field of 30+ dormant volcanic cones and lava flows",
      "Baker: World's Tallest Thermometer and last fuel stop before Death Valley"
    ],
    coordinates: {
      start: [34.1356, -116.0542],
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
  startLocation: "Temecula, California",
  endLocation: "Furnace Creek, Death Valley",
  countries: ["USA", "Mexico"]
};
