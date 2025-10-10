/**
 * ✈️ Travel Search API
 * Search hotels and flights for trip planning
 */

/**
 * Popular Turkish destinations with sample hotels
 */
const DESTINATIONS = {
  antalya: [
    { name: 'Rixos Premium Belek', rating: 4.8, pricePerNight: 3500, amenities: ['all-inclusive', 'spa', 'beach'] },
    { name: 'Maxx Royal Kemer Resort', rating: 4.9, pricePerNight: 4200, amenities: ['all-inclusive', 'spa', 'kids-club'] },
    { name: 'Titanic Beach Lara', rating: 4.6, pricePerNight: 2800, amenities: ['all-inclusive', 'beach', 'pool'] },
    { name: 'Regnum Carya Golf', rating: 4.7, pricePerNight: 3200, amenities: ['golf', 'spa', 'pool'] },
    { name: 'Delphin Imperial', rating: 4.5, pricePerNight: 2400, amenities: ['all-inclusive', 'aquapark', 'beach'] }
  ],
  istanbul: [
    { name: 'Four Seasons Sultanahmet', rating: 4.9, pricePerNight: 5500, amenities: ['historic', 'spa', 'restaurant'] },
    { name: 'Çırağan Palace Kempinski', rating: 4.8, pricePerNight: 6200, amenities: ['palace', 'bosphorus', 'spa'] },
    { name: 'Raffles Istanbul', rating: 4.7, pricePerNight: 4800, amenities: ['city-view', 'spa', 'rooftop'] },
    { name: 'The Ritz-Carlton Istanbul', rating: 4.6, pricePerNight: 4200, amenities: ['bosphorus', 'spa', 'pool'] },
    { name: 'Swissotel The Bosphorus', rating: 4.5, pricePerNight: 3200, amenities: ['bosphorus', 'pool', 'spa'] }
  ],
  izmir: [
    { name: 'Swissotel Büyük Efes', rating: 4.6, pricePerNight: 2200, amenities: ['city-center', 'pool', 'spa'] },
    { name: 'Hilton Izmir', rating: 4.5, pricePerNight: 1800, amenities: ['beach', 'pool', 'restaurant'] },
    { name: 'Renaissance Izmir', rating: 4.4, pricePerNight: 1600, amenities: ['beach', 'pool', 'spa'] },
    { name: 'Park Inn by Radisson', rating: 4.3, pricePerNight: 1200, amenities: ['city-center', 'restaurant'] },
    { name: 'Wyndham Grand Izmir', rating: 4.2, pricePerNight: 1400, amenities: ['beach', 'pool'] }
  ],
  bodrum: [
    { name: 'Mandarin Oriental Bodrum', rating: 4.9, pricePerNight: 7500, amenities: ['beach', 'spa', 'fine-dining'] },
    { name: 'Amanruya', rating: 4.8, pricePerNight: 8200, amenities: ['private-beach', 'spa', 'luxury'] },
    { name: 'Caresse Bodrum', rating: 4.7, pricePerNight: 4800, amenities: ['beach', 'spa', 'pool'] },
    { name: 'Kempinski Barbaros Bay', rating: 4.6, pricePerNight: 4200, amenities: ['beach', 'spa', 'restaurant'] },
    { name: 'Nikki Beach Resort', rating: 4.5, pricePerNight: 3800, amenities: ['beach-club', 'pool', 'nightlife'] }
  ],
  default: [
    { name: 'Luxury Resort & Spa', rating: 4.6, pricePerNight: 2500, amenities: ['spa', 'pool', 'restaurant'] },
    { name: 'Grand Hotel', rating: 4.4, pricePerNight: 1800, amenities: ['pool', 'restaurant'] },
    { name: 'Beach Paradise Hotel', rating: 4.3, pricePerNight: 1500, amenities: ['beach', 'pool'] },
    { name: 'City Center Hotel', rating: 4.2, pricePerNight: 1200, amenities: ['city-center'] },
    { name: 'Budget Friendly Inn', rating: 4.0, pricePerNight: 800, amenities: ['wifi'] }
  ]
};

/**
 * Search hotels for trip
 */
async function searchTrip(req, res) {
  const { destination, nights, guests, checkIn, checkOut } = req.body;

  // Validation
  if (!destination || destination.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Destination is required'
    });
  }

  if (!nights || nights < 1 || nights > 365) {
    return res.status(400).json({
      success: false,
      error: 'Nights must be between 1 and 365'
    });
  }

  if (!guests || guests < 1 || guests > 20) {
    return res.status(400).json({
      success: false,
      error: 'Guests must be between 1 and 20'
    });
  }

  // Normalize destination
  const normalizedDest = destination.toLowerCase().trim();

  // Find hotels for destination
  let hotels = DESTINATIONS[normalizedDest] || DESTINATIONS.default;

  // Clone and calculate total prices
  hotels = hotels.map((hotel) => {
    const totalPrice = hotel.pricePerNight * nights;

    // Add some variance based on guests
    let guestAdjustment = 1;
    if (guests > 2) {
      guestAdjustment = 1 + ((guests - 2) * 0.15);
    }

    return {
      ...hotel,
      pricePerNight: Math.round(hotel.pricePerNight * guestAdjustment),
      totalPrice: Math.round(totalPrice * guestAdjustment),
      availableRooms: Math.floor(Math.random() * 10) + 1
    };
  });

  // Sort by rating (best first)
  hotels.sort((a, b) => b.rating - a.rating);

  // Calculate average price
  const avgPrice = Math.round(
    hotels.reduce((sum, h) => sum + h.totalPrice, 0) / hotels.length
  );

  res.json({
    success: true,
    destination: destination,
    nights,
    guests,
    checkIn,
    checkOut,
    hotels,
    totalResults: hotels.length,
    averagePrice: avgPrice,
    timestamp: new Date().toISOString()
  });
}

module.exports = { searchTrip };
