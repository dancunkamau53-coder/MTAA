const prisma = require("../lib/prisma");

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

// =====================================================
// SERVICE TYPES
// =====================================================

const SERVICE_TYPES = [
  {
    key: "hospital",
    label: "Hospital",
    icon: "🏥",
    detail: "Medical care",
    queries: [
      "hospital",
      "clinic",
      "medical centre",
      "medical center",
    ],
  },

  {
    key: "school",
    label: "School",
    icon: "🏫",
    detail: "Education access",
    queries: [
      "school",
      "academy",
      "college",
    ],
  },

  {
    key: "shopping",
    label: "Shopping",
    icon: "🛒",
    detail: "Daily essentials",
    queries: [
      "supermarket",
      "shopping mall",
      "shop",
    ],
  },

  {
    key: "transport",
    label: "Transport",
    icon: "🚌",
    detail: "Public transport",
    queries: [
      "bus station",
      "bus stop",
      "matatu stage",
    ],
  },

  {
    key: "police",
    label: "Police Station",
    icon: "👮",
    detail: "Security services",
    queries: [
      "police station",
      "police",
    ],
  },

  {
    key: "fuel",
    label: "Petrol Station",
    icon: "⛽",
    detail: "Fuel and vehicle services",
    queries: [
      "petrol station",
      "fuel station",
      "gas station",
    ],
  },

  {
    key: "bank",
    label: "Bank / ATM",
    icon: "🏦",
    detail: "Banking services",
    queries: [
      "bank",
      "ATM",
    ],
  },

  {
    key: "restaurant",
    label: "Restaurant",
    icon: "🍽️",
    detail: "Food and dining",
    queries: [
      "restaurant",
      "cafe",
      "food",
    ],
  },
];

// =====================================================
// DISTANCE CALCULATION
// =====================================================

const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const earthRadiusKm = 6371;

  const dLatitude = toRadians(
    latitude2 - latitude1
  );

  const dLongitude = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLongitude / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};

// =====================================================
// FORMAT DISTANCE
// =====================================================

const formatDistance = (
  distanceKm
) => {
  if (distanceKm < 1) {
    return {
      value: Math.round(
        distanceKm * 1000
      ),
      unit: "m",
    };
  }

  return {
    value: Number(
      distanceKm.toFixed(1)
    ),
    unit: "km",
  };
};

// =====================================================
// SEARCH NOMINATIM
// =====================================================

const searchService = async (
  query,
  latitude,
  longitude
) => {
  // Approximately 5 km around
  // the property.

  const radiusDegrees = 0.05;

  const left =
    longitude - radiusDegrees;

  const right =
    longitude + radiusDegrees;

  const top =
    latitude + radiusDegrees;

  const bottom =
    latitude - radiusDegrees;

  const url =
    new URL(NOMINATIM_URL);

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "format",
    "jsonv2"
  );

  url.searchParams.set(
    "limit",
    "5"
  );

  url.searchParams.set(
    "addressdetails",
    "1"
  );

  url.searchParams.set(
    "viewbox",
    `${left},${top},${right},${bottom}`
  );

  url.searchParams.set(
    "bounded",
    "1"
  );

  const response =
    await fetch(url, {
      method: "GET",

      headers: {
        Accept:
          "application/json",

        "User-Agent":
          "MTAA/1.0 property-platform",
      },
    });

  if (!response.ok) {
    throw new Error(
      `Nominatim returned HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  return Array.isArray(data)
    ? data
    : [];
};

// =====================================================
// FIND NEAREST RESULT
// =====================================================

const findNearestResult = (
  results,
  latitude,
  longitude
) => {
  let nearest = null;

  for (
    const result of results
  ) {
    const resultLatitude =
      Number(result.lat);

    const resultLongitude =
      Number(result.lon);

    if (
      !Number.isFinite(
        resultLatitude
      ) ||
      !Number.isFinite(
        resultLongitude
      )
    ) {
      continue;
    }

    const distanceKm =
      calculateDistanceKm(
        latitude,
        longitude,
        resultLatitude,
        resultLongitude
      );

    // Only keep places within 5 km.

    if (
      distanceKm > 5
    ) {
      continue;
    }

    if (
      !nearest ||
      distanceKm <
        nearest.distanceKm
    ) {
      nearest = {
        result,
        distanceKm,
      };
    }
  }

  return nearest;
};

// =====================================================
// GET NEARBY PLACES
// GET /api/properties/:id/nearby-places
// =====================================================

const getNearbyPlaces = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    console.log(
      `📍 Finding nearby places for property: ${id}`
    );

    // =================================================
    // FIND PROPERTY
    // =================================================

    const property =
      await prisma.property.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
            title: true,
            location: true,
            latitude: true,
            longitude: true,
          },
        }
      );

    // =================================================
    // PROPERTY NOT FOUND
    // =================================================

    if (!property) {
      return res.status(404).json({
        success: false,

        message:
          "Property not found.",

        places: [],
      });
    }

    // =================================================
    // CHECK GPS
    // =================================================

    if (
      property.latitude === null ||
      property.latitude ===
        undefined ||
      property.longitude === null ||
      property.longitude ===
        undefined
    ) {
      return res.status(400).json({
        success: false,

        message:
          "This property does not have GPS coordinates.",

        places: [],
      });
    }

    const latitude =
      Number(property.latitude);

    const longitude =
      Number(property.longitude);

    // =================================================
    // VALIDATE GPS
    // =================================================

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid property GPS coordinates.",

        places: [],
      });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Property GPS coordinates are outside the valid range.",

        places: [],
      });
    }

    console.log(
      `📍 Property coordinates: ${latitude}, ${longitude}`
    );

    // =================================================
    // SEARCH ALL SERVICES
    // =================================================

    const places = [];

    for (
      const service of SERVICE_TYPES
    ) {
      let nearestPlace = null;

      for (
        const query of service.queries
      ) {
        try {
          console.log(
            `🔎 Searching ${service.label}: ${query}`
          );

          const results =
            await searchService(
              query,
              latitude,
              longitude
            );

          const nearest =
            findNearestResult(
              results,
              latitude,
              longitude
            );

          if (
            nearest &&
            (
              !nearestPlace ||
              nearest.distanceKm <
                nearestPlace.distanceKm
            )
          ) {
            nearestPlace =
              nearest;
          }
        } catch (error) {
          console.error(
            `⚠️ Failed searching ${query}:`,
            error.message
          );
        }

        // If we already found something
        // very close, don't search more
        // queries for this category.

        if (
          nearestPlace &&
          nearestPlace.distanceKm <
            0.5
        ) {
          break;
        }
      }

      // No result for this category.

      if (!nearestPlace) {
        continue;
      }

      const result =
        nearestPlace.result;

      const distance =
        formatDistance(
          nearestPlace.distanceKm
        );

      places.push({
        id:
          `${service.key}-${result.place_id}`,

        name:
          result.name ||
          result.display_name
            ?.split(",")[0] ||
          service.label,

        category:
          service.key,

        label:
          service.label,

        icon:
          service.icon,

        detail:
          service.detail,

        value:
          distance.value,

        unit:
          distance.unit,

        distanceKm:
          nearestPlace.distanceKm,

        latitude:
          Number(result.lat),

        longitude:
          Number(result.lon),

        address:
          result.display_name ||
          "",
      });
    }

    // =================================================
    // SORT BY DISTANCE
    // =================================================

    places.sort(
      (a, b) =>
        a.distanceKm -
        b.distanceKm
    );

    console.log(
      `✅ Nearby places found: ${places.length}`
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.json({
      success: true,

      property: {
        id: property.id,

        title:
          property.title,

        location:
          property.location,

        latitude,

        longitude,
      },

      places,
    });
  } catch (error) {
    // =================================================
    // ERROR
    // =================================================

    console.error(
      "❌ Nearby places error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to load nearby places.",

      places: [],
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getNearbyPlaces,
};