// /pages/api/location/search.js
// HYBRID LOCATION SEARCH API - No corner cases slip through the cracks
// Combines comprehensive local database with Google Maps API fallback

// EXPANDED MAJOR CITIES DATABASE - Now includes missing EDM hotspots
const MAJOR_CITIES = [
  // CANADA - Major EDM Cities
  { name: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lon: -79.3832, 
    aliases: ["toronto", "toranto", "toront", "t.o", "the 6ix"], region: "ON" },
  { name: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lon: -73.5673, 
    aliases: ["montreal", "montréal", "monreal", "mtl"], region: "QC" },
  { name: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lon: -123.1207, 
    aliases: ["vancouver", "vancuver", "van", "yvr"], region: "BC" },
  { name: "Calgary", country: "Canada", countryCode: "CA", lat: 51.0447, lon: -114.0719, 
    aliases: ["calgary", "calgry", "yyc"], region: "AB" },
  { name: "Ottawa", country: "Canada", countryCode: "CA", lat: 45.4215, lon: -75.6972, 
    aliases: ["ottawa", "otawa", "yow"], region: "ON" },
  { name: "Edmonton", country: "Canada", countryCode: "CA", lat: 53.5461, lon: -113.4938, 
    aliases: ["edmonton", "edm", "yeg"], region: "AB" },

  // UNITED STATES - Major EDM Cities
  { name: "New York", country: "United States", countryCode: "US", lat: 40.7128, lon: -74.0060, 
    aliases: ["new york", "nyc", "ny", "newyork", "new york city", "manhattan"], region: "NY" },
  { name: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lon: -118.2437, 
    aliases: ["los angeles", "la", "los angelos", "l.a.", "los angeles"], region: "CA" },
  { name: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lon: -87.6298, 
    aliases: ["chicago", "chicgo", "chi", "windy city"], region: "IL" },
  { name: "Miami", country: "United States", countryCode: "US", lat: 25.7617, lon: -80.1918, 
    aliases: ["miami", "mia", "magic city"], region: "FL" },
  { name: "Las Vegas", country: "United States", countryCode: "US", lat: 36.1699, lon: -115.1398, 
    aliases: ["las vegas", "vegas", "lv", "sin city"], region: "NV" },
  { name: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lon: -122.4194, 
    aliases: ["san francisco", "sf", "san fran", "frisco"], region: "CA" },
  { name: "Seattle", country: "United States", countryCode: "US", lat: 47.6062, lon: -122.3321, 
    aliases: ["seattle", "seatle", "emerald city"], region: "WA" },
  { name: "Denver", country: "United States", countryCode: "US", lat: 39.7392, lon: -104.9903, 
    aliases: ["denver", "mile high city"], region: "CO" },
  { name: "Austin", country: "United States", countryCode: "US", lat: 30.2672, lon: -97.7431, 
    aliases: ["austin", "atx", "live music capital"], region: "TX" },
  { name: "Atlanta", country: "United States", countryCode: "US", lat: 33.7490, lon: -84.3880, 
    aliases: ["atlanta", "atl", "hotlanta"], region: "GA" },
  { name: "Boston", country: "United States", countryCode: "US", lat: 42.3601, lon: -71.0589, 
    aliases: ["boston", "beantown"], region: "MA" },
  { name: "Philadelphia", country: "United States", countryCode: "US", lat: 39.9526, lon: -75.1652, 
    aliases: ["philadelphia", "philly", "city of brotherly love"], region: "PA" },
  { name: "Detroit", country: "United States", countryCode: "US", lat: 42.3314, lon: -83.0458, 
    aliases: ["detroit", "motor city", "motown"], region: "MI" },
  { name: "Phoenix", country: "United States", countryCode: "US", lat: 33.4484, lon: -112.0740, 
    aliases: ["phoenix", "phx"], region: "AZ" },
  { name: "San Diego", country: "United States", countryCode: "US", lat: 32.7157, lon: -117.1611, 
    aliases: ["san diego", "sd"], region: "CA" },

  // UNITED KINGDOM - Major EDM Cities
  { name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lon: -0.1278, 
    aliases: ["london", "londn", "big smoke"], region: "England" },
  { name: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.4808, lon: -2.2426, 
    aliases: ["manchester", "manchster", "manc"], region: "England" },
  { name: "Birmingham", country: "United Kingdom", countryCode: "GB", lat: 52.4862, lon: -1.8904, 
    aliases: ["birmingham", "brum"], region: "England" },
  { name: "Glasgow", country: "United Kingdom", countryCode: "GB", lat: 55.8642, lon: -4.2518, 
    aliases: ["glasgow", "glasgw"], region: "Scotland" },
  { name: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.9533, lon: -3.1883, 
    aliases: ["edinburgh", "edinbrgh"], region: "Scotland" },
  { name: "Bristol", country: "United Kingdom", countryCode: "GB", lat: 51.4545, lon: -2.5879, 
    aliases: ["bristol", "bristl"], region: "England" },
  { name: "Leeds", country: "United Kingdom", countryCode: "GB", lat: 53.8008, lon: -1.5491, 
    aliases: ["leeds", "leds"], region: "England" },

  // GERMANY - Major EDM Cities
  { name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.5200, lon: 13.4050, 
    aliases: ["berlin", "berln"], region: "Berlin" },
  { name: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lon: 11.5820, 
    aliases: ["munich", "münchen", "munchen"], region: "Bavaria" },
  { name: "Hamburg", country: "Germany", countryCode: "DE", lat: 53.5511, lon: 9.9937, 
    aliases: ["hamburg", "hambourg"], region: "Hamburg" },
  { name: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.1109, lon: 8.6821, 
    aliases: ["frankfurt", "frankfurt am main"], region: "Hesse" },
  { name: "Cologne", country: "Germany", countryCode: "DE", lat: 50.9375, lon: 6.9603, 
    aliases: ["cologne", "köln", "koln"], region: "North Rhine-Westphalia" },

  // NETHERLANDS - Major EDM Cities
  { name: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lon: 4.9041, 
    aliases: ["amsterdam", "dam"], region: "North Holland" },
  { name: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.9244, lon: 4.4777, 
    aliases: ["rotterdam", "roterdam"], region: "South Holland" },
  { name: "The Hague", country: "Netherlands", countryCode: "NL", lat: 52.0705, lon: 4.3007, 
    aliases: ["the hague", "den haag", "hague"], region: "South Holland" },

  // FRANCE - Major EDM Cities
  { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lon: 2.3522, 
    aliases: ["paris", "city of light"], region: "Île-de-France" },
  { name: "Marseille", country: "France", countryCode: "FR", lat: 43.2965, lon: 5.3698, 
    aliases: ["marseille", "marseilles"], region: "Provence-Alpes-Côte d'Azur" },
  { name: "Lyon", country: "France", countryCode: "FR", lat: 45.7640, lon: 4.8357, 
    aliases: ["lyon", "lyons"], region: "Auvergne-Rhône-Alpes" },
  { name: "Nice", country: "France", countryCode: "FR", lat: 43.7102, lon: 7.2620, 
    aliases: ["nice"], region: "Provence-Alpes-Côte d'Azur" },

  // SPAIN - Major EDM Cities
  { name: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lon: -3.7038, 
    aliases: ["madrid"], region: "Community of Madrid" },
  { name: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3851, lon: 2.1734, 
    aliases: ["barcelona", "barca"], region: "Catalonia" },
  { name: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lon: -0.3763, 
    aliases: ["valencia"], region: "Valencian Community" },
  { name: "Seville", country: "Spain", countryCode: "ES", lat: 37.3891, lon: -5.9845, 
    aliases: ["seville", "sevilla"], region: "Andalusia" },

  // IBIZA - Special EDM Destination
  { name: "Ibiza", country: "Spain", countryCode: "ES", lat: 38.9067, lon: 1.4206, 
    aliases: ["ibiza", "eivissa"], region: "Balearic Islands" },

  // ITALY - Major EDM Cities
  { name: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lon: 12.4964, 
    aliases: ["rome", "roma", "eternal city"], region: "Lazio" },
  { name: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lon: 9.1900, 
    aliases: ["milan", "milano"], region: "Lombardy" },
  { name: "Naples", country: "Italy", countryCode: "IT", lat: 40.8518, lon: 14.2681, 
    aliases: ["naples", "napoli"], region: "Campania" },

  // AUSTRALIA - Major EDM Cities
  { name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lon: 151.2093, 
    aliases: ["sydney", "sydny"], region: "New South Wales" },
  { name: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lon: 144.9631, 
    aliases: ["melbourne", "melb"], region: "Victoria" },
  { name: "Brisbane", country: "Australia", countryCode: "AU", lat: -27.4698, lon: 153.0251, 
    aliases: ["brisbane", "bris"], region: "Queensland" },
  { name: "Perth", country: "Australia", countryCode: "AU", lat: -31.9505, lon: 115.8605, 
    aliases: ["perth"], region: "Western Australia" },

  // BRAZIL - Major EDM Cities
  { name: "São Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lon: -46.6333, 
    aliases: ["são paulo", "sao paulo", "sp"], region: "São Paulo" },
  { name: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.9068, lon: -43.1729, 
    aliases: ["rio de janeiro", "rio", "cidade maravilhosa"], region: "Rio de Janeiro" },
  { name: "Brasília", country: "Brazil", countryCode: "BR", lat: -15.8267, lon: -47.9218, 
    aliases: ["brasília", "brasilia"], region: "Federal District" },

  // MEXICO - Major EDM Cities + TULUM
  { name: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4326, lon: -99.1332, 
    aliases: ["mexico city", "cdmx", "ciudad de méxico"], region: "Mexico City" },
  { name: "Guadalajara", country: "Mexico", countryCode: "MX", lat: 20.6597, lon: -103.3496, 
    aliases: ["guadalajara", "gdl"], region: "Jalisco" },
  { name: "Cancún", country: "Mexico", countryCode: "MX", lat: 21.1619, lon: -86.8515, 
    aliases: ["cancún", "cancun"], region: "Quintana Roo" },
  { name: "Playa del Carmen", country: "Mexico", countryCode: "MX", lat: 20.6296, lon: -87.0739, 
    aliases: ["playa del carmen", "playa"], region: "Quintana Roo" },
  // TULUM - Global EDM Destination
  { name: "Tulum", country: "Mexico", countryCode: "MX", lat: 20.2114, lon: -87.4654, 
    aliases: ["tulum", "tulm"], region: "Quintana Roo" },

  // CHINA - Massive EDM Market
  { name: "Beijing", country: "China", countryCode: "CN", lat: 39.9042, lon: 116.4074, 
    aliases: ["beijing", "peking"], region: "Beijing" },
  { name: "Shanghai", country: "China", countryCode: "CN", lat: 31.2304, lon: 121.4737, 
    aliases: ["shanghai"], region: "Shanghai" },
  { name: "Shenzhen", country: "China", countryCode: "CN", lat: 22.5431, lon: 114.0579, 
    aliases: ["shenzhen"], region: "Guangdong" },
  { name: "Guangzhou", country: "China", countryCode: "CN", lat: 23.1291, lon: 113.2644, 
    aliases: ["guangzhou", "canton"], region: "Guangdong" },

  // INDONESIA - BALI + Major Cities
  { name: "Denpasar", country: "Indonesia", countryCode: "ID", lat: -8.6500, lon: 115.2167, 
    aliases: ["denpasar", "bali", "denpasar bali"], region: "Bali" },
  { name: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.2088, lon: 106.8456, 
    aliases: ["jakarta"], region: "Jakarta" },

  // UKRAINE - Major EDM Scene
  { name: "Kyiv", country: "Ukraine", countryCode: "UA", lat: 50.4501, lon: 30.5234, 
    aliases: ["kyiv", "kiev"], region: "Kyiv" },
  { name: "Odesa", country: "Ukraine", countryCode: "UA", lat: 46.4825, lon: 30.7233, 
    aliases: ["odesa", "odessa"], region: "Odesa" },
  { name: "Kharkiv", country: "Ukraine", countryCode: "UA", lat: 49.9935, lon: 36.2304, 
    aliases: ["kharkiv", "kharkov"], region: "Kharkiv" },

  // EASTERN EUROPE - Major EDM Scenes
  { name: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.0755, lon: 14.4378, 
    aliases: ["prague", "praha"], region: "Prague" },
  { name: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.4979, lon: 19.0402, 
    aliases: ["budapest"], region: "Budapest" },
  { name: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lon: 21.0122, 
    aliases: ["warsaw", "warszawa"], region: "Masovian" },
  { name: "Bucharest", country: "Romania", countryCode: "RO", lat: 44.4268, lon: 26.1025, 
    aliases: ["bucharest", "bucuresti"], region: "Bucharest" },

  // ASIA-PACIFIC - Growing EDM Scenes
  { name: "Manila", country: "Philippines", countryCode: "PH", lat: 14.5995, lon: 120.9842, 
    aliases: ["manila"], region: "Metro Manila" },
  { name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.1390, lon: 101.6869, 
    aliases: ["kuala lumpur", "kl"], region: "Federal Territory" },
  { name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", lat: 10.8231, lon: 106.6297, 
    aliases: ["ho chi minh city", "saigon", "hcmc"], region: "Ho Chi Minh City" },

  // MIDDLE EAST - Electronic Music Hubs
  { name: "Beirut", country: "Lebanon", countryCode: "LB", lat: 33.8938, lon: 35.5018, 
    aliases: ["beirut"], region: "Beirut" },
  { name: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.0082, lon: 28.9784, 
    aliases: ["istanbul", "constantinople"], region: "Istanbul" },

  // SOUTH AMERICA - Growing EDM Scenes
  { name: "Medellín", country: "Colombia", countryCode: "CO", lat: 6.2442, lon: -75.5812, 
    aliases: ["medellín", "medellin"], region: "Antioquia" },
  { name: "Lima", country: "Peru", countryCode: "PE", lat: -12.0464, lon: -77.0428, 
    aliases: ["lima"], region: "Lima" },
  { name: "Santiago", country: "Chile", countryCode: "CL", lat: -33.4489, lon: -70.6693, 
    aliases: ["santiago"], region: "Santiago Metropolitan" },

  // JAPAN - Major EDM Cities
  { name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503, 
    aliases: ["tokyo", "tokio"], region: "Kantō" },
  { name: "Osaka", country: "Japan", countryCode: "JP", lat: 34.6937, lon: 135.5023, 
    aliases: ["osaka"], region: "Kansai" },
  { name: "Kyoto", country: "Japan", countryCode: "JP", lat: 35.0116, lon: 135.7681, 
    aliases: ["kyoto"], region: "Kansai" },

  // SOUTH KOREA - Major EDM Cities
  { name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.9780, 
    aliases: ["seoul"], region: "Seoul Capital Area" },
  { name: "Busan", country: "South Korea", countryCode: "KR", lat: 35.1796, lon: 129.0756, 
    aliases: ["busan", "pusan"], region: "South Gyeongsang" },

  // ADDITIONAL POPULAR EDM DESTINATIONS
  { name: "Tel Aviv", country: "Israel", countryCode: "IL", lat: 32.0853, lon: 34.7818, 
    aliases: ["tel aviv", "telaviv"], region: "Tel Aviv District" },
  { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lon: 55.2708, 
    aliases: ["dubai"], region: "Dubai" },
  { name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198, 
    aliases: ["singapore"], region: "Singapore" },
  { name: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.3193, lon: 114.1694, 
    aliases: ["hong kong", "hk"], region: "Hong Kong" },
  { name: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lon: 100.5018, 
    aliases: ["bangkok"], region: "Bangkok" },
  { name: "Mumbai", country: "India", countryCode: "IN", lat: 19.0760, lon: 72.8777, 
    aliases: ["mumbai", "bombay"], region: "Maharashtra" },
  { name: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6118, lon: -58.3960, 
    aliases: ["buenos aires", "baires"], region: "Buenos Aires" },
  { name: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lon: 18.4241, 
    aliases: ["cape town", "capetown"], region: "Western Cape" },
  { name: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.2041, lon: 28.0473, 
    aliases: ["johannesburg", "joburg", "jozi"], region: "Gauteng" }
];

// FUZZY MATCHING UTILITIES
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function fuzzyMatch(query, cityName, aliases = []) {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedCityName = cityName.toLowerCase();
  
  // Exact match (highest score)
  if (normalizedCityName === normalizedQuery) return 100;
  
  // Alias exact match
  for (const alias of aliases) {
    if (alias.toLowerCase() === normalizedQuery) return 95;
  }
  
  // Starts with match
  if (normalizedCityName.startsWith(normalizedQuery)) return 90;
  
  // Alias starts with match
  for (const alias of aliases) {
    if (alias.toLowerCase().startsWith(normalizedQuery)) return 85;
  }
  
  // Contains match
  if (normalizedCityName.includes(normalizedQuery)) return 80;
  
  // Alias contains match
  for (const alias of aliases) {
    if (alias.toLowerCase().includes(normalizedQuery)) return 75;
  }
  
  // Levenshtein distance for typo handling
  const cityDistance = levenshteinDistance(normalizedQuery, normalizedCityName);
  if (cityDistance <= 2) {
    return Math.max(70 - cityDistance * 10, 50);
  }
  
  // Check aliases for typos
  for (const alias of aliases) {
    const aliasDistance = levenshteinDistance(normalizedQuery, alias.toLowerCase());
    if (aliasDistance <= 2) {
      return Math.max(65 - aliasDistance * 10, 45);
    }
  }
  
  return 0;
}

// GOOGLE MAPS API FALLBACK
async function queryGoogleMapsAPI(query) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ Google Maps API key not configured, skipping fallback');
      return [];
    }
    
    console.log(`🌍 Querying Google Maps API for: "${query}"`);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results) {
      const suggestions = data.results
        .filter(result => 
          result.types.includes('locality') || 
          result.types.includes('administrative_area_level_1') ||
          result.types.includes('political')
        )
        .slice(0, 5) // Limit Google results
        .map(result => {
          const location = {
            name: extractCityName(result.address_components) || result.formatted_address.split(',')[0],
            formattedAddress: result.formatted_address,
            lat: result.geometry.location.lat,
            lon: result.geometry.location.lng,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            source: 'google_maps'
          };

          // Extract city, state, and country from address components
          if (result.address_components) {
            result.address_components.forEach(component => {
              const types = component.types;
              if (types.includes('locality')) {
                location.city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                location.region = component.short_name;
                location.stateCode = component.short_name;
              } else if (types.includes('country')) {
                location.country = component.long_name;
                location.countryCode = component.short_name;
              }
            });
          }

          // If no city found, use the name
          if (!location.city && location.name) {
            location.city = location.name;
          }

          return location;
        });

      console.log(`✅ Google Maps returned ${suggestions.length} suggestions`);
      return suggestions;
    } else {
      console.log(`⚠️ Google Maps API returned status: ${data.status}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error querying Google Maps API:', error);
    return [];
  }
}

function extractCityName(addressComponents) {
  for (const component of addressComponents) {
    if (component.types.includes('locality')) {
      return component.long_name;
    }
  }
  return null;
}

// MAIN API HANDLER - HYBRID APPROACH
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query parameter is required',
        suggestions: []
      });
    }
    
    if (query.trim().length < 1) {
      return res.json({ suggestions: [] });
    }
    
    console.log(`🔍 Hybrid location search for: "${query}"`);
    
    // PHASE 1: Search local database first (fast)
    const localSuggestions = MAJOR_CITIES
      .map(city => ({
        ...city,
        score: fuzzyMatch(query, city.name, city.aliases)
      }))
      .filter(city => city.score > 40)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5) // Limit local results
      .map(({ score, aliases, ...city }) => ({
        ...city,
        formattedAddress: `${city.name}, ${city.region ? city.region + ', ' : ''}${city.country}`,
        latitude: city.lat,
        longitude: city.lon,
        city: city.name,
        stateCode: city.region,
        matchConfidence: score,
        source: 'local_database'
      }));
    
    console.log(`📍 Local database found ${localSuggestions.length} suggestions`);
    
    // PHASE 2: If we have good local matches, return them
    if (localSuggestions.length > 0 && localSuggestions[0].matchConfidence >= 70) {
      console.log(`✅ Returning local suggestions (best match: ${localSuggestions[0].matchConfidence}%)`);
      return res.status(200).json({
        success: true,
        query: query,
        suggestions: localSuggestions,
        count: localSuggestions.length,
        source: 'local_database'
      });
    }
    
    // PHASE 3: Fallback to Google Maps API for unknown cities
    if (query.trim().length >= 3) {
      console.log(`🌍 No good local matches, falling back to Google Maps API`);
      
      const googleSuggestions = await queryGoogleMapsAPI(query);
      
      // Combine local and Google suggestions, prioritizing local
      const combinedSuggestions = [
        ...localSuggestions,
        ...googleSuggestions
      ].slice(0, 8); // Limit total suggestions
      
      console.log(`✅ Returning hybrid results: ${localSuggestions.length} local + ${googleSuggestions.length} Google`);
      
      return res.status(200).json({
        success: true,
        query: query,
        suggestions: combinedSuggestions,
        count: combinedSuggestions.length,
        source: 'hybrid',
        breakdown: {
          local: localSuggestions.length,
          google: googleSuggestions.length
        }
      });
    }
    
    // PHASE 4: Return local suggestions even if confidence is lower
    console.log(`📍 Returning available local suggestions`);
    return res.status(200).json({
      success: true,
      query: query,
      suggestions: localSuggestions,
      count: localSuggestions.length,
      source: 'local_database'
    });
    
  } catch (error) {
    console.error('❌ Error in hybrid location search API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      suggestions: [],
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

