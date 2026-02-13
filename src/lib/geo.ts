// Geographic data for map view
// City coordinates and region boundaries

// City center coordinates [latitude, longitude]
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'marrakech': [31.6295, -7.9811],
  'essaouira': [31.5085, -9.7595],
  'casablanca': [33.5731, -7.5898],
  'rabat': [34.0209, -6.8416],
  'fes': [34.0181, -5.0078],
  'agadir': [30.4278, -9.5981],
  'tangier': [35.7595, -5.8340],
  'tetouan': [35.5784, -5.3684],
  'chefchaouen': [35.1688, -5.2636],
  'el-jadida': [33.2316, -8.5007],
  'moulay-idriss-zerhoun': [34.0553, -5.5242],
  'tan-tan': [28.4380, -11.1031],
  'merzouga': [31.0801, -4.0134],
  'imilchil': [32.1528, -5.6292],
  // Additional cities for festival coverage
  'ouarzazate': [30.9189, -6.8936],
  'erfoud': [31.4314, -4.2286],
  'mhamid': [29.8256, -5.7231],
  'asilah': [35.4653, -6.0341],
  'ifrane': [33.5228, -5.1109],
  'kelaat-mgouna': [31.2369, -6.1297],
  'tafraoute': [29.7211, -8.9753],
  'sefrou': [33.8306, -4.8353],
  'meknes': [33.8731, -5.5407],
  'oujda': [34.6867, -1.9114],
  'taza': [34.2133, -4.0103],
  'zagora': [30.3314, -5.8381],
  'taroudant': [30.4706, -8.8769],
  'tiznit': [29.6974, -9.7316],
  'dakhla': [23.6848, -15.9580],
  'laayoune': [27.1536, -13.2033],
  'nador': [35.1681, -2.9287],
  'al-hoceima': [35.2517, -3.9372],
  'saidia': [35.0867, -2.3347],
  'beni-mellal': [32.3373, -6.3498],
  'khouribga': [32.8811, -6.9063],
  'settat': [33.0017, -7.6167]
};

// Region center coordinates for label placement [latitude, longitude]
export const REGION_CENTERS: Record<string, [number, number]> = {
  'tanger-tetouan-al-hoceima': [35.2, -5.5],
  'oriental': [34.3, -2.5],
  'fes-meknes': [34.0, -5.0],
  'rabat-sale-kenitra': [34.0, -6.8],
  'beni-mellal-khenifra': [32.5, -6.5],
  'casablanca-settat': [33.2, -7.8],
  'marrakech-safi': [31.8, -8.5],
  'draa-tafilalet': [31.5, -5.5],
  'souss-massa': [30.0, -9.0],
  'guelmim-oued-noun': [28.5, -10.0],
  'laayoune-sakia-el-hamra': [26.5, -13.0],
  'dakhla-oued-ed-dahab': [23.5, -15.5]
};

// Simplified Morocco regions GeoJSON
// Boundaries are approximate for display purposes
export const MOROCCO_REGIONS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "slug": "tanger-tetouan-al-hoceima", "name": "Tanger-Tétouan-Al Hoceïma" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-6.5, 35.9], [-5.0, 35.9], [-4.0, 35.3], [-4.0, 34.7], [-5.0, 34.5], [-6.0, 34.8], [-6.5, 35.5], [-6.5, 35.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "oriental", "name": "Oriental" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-4.0, 35.3], [-2.0, 35.1], [-2.0, 32.5], [-3.5, 32.0], [-4.5, 33.5], [-4.0, 34.7], [-4.0, 35.3]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "fes-meknes", "name": "Fès-Meknès" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-6.0, 34.8], [-5.0, 34.5], [-4.0, 34.7], [-4.5, 33.5], [-3.5, 32.0], [-4.5, 32.0], [-6.0, 33.0], [-6.5, 34.0], [-6.0, 34.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "rabat-sale-kenitra", "name": "Rabat-Salé-Kénitra" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-7.2, 34.8], [-6.0, 34.8], [-6.5, 34.0], [-6.0, 33.5], [-7.0, 33.5], [-7.5, 34.0], [-7.2, 34.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "beni-mellal-khenifra", "name": "Béni Mellal-Khénifra" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-6.0, 33.5], [-6.0, 33.0], [-4.5, 32.0], [-5.5, 31.5], [-7.0, 32.0], [-7.0, 33.5], [-6.0, 33.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "casablanca-settat", "name": "Casablanca-Settat" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-8.8, 33.8], [-7.0, 33.5], [-7.0, 32.5], [-8.0, 32.3], [-9.0, 32.8], [-8.8, 33.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "marrakech-safi", "name": "Marrakech-Safi" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-9.8, 32.5], [-8.0, 32.3], [-7.0, 32.0], [-7.0, 31.0], [-8.0, 30.5], [-9.8, 31.2], [-9.8, 32.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "draa-tafilalet", "name": "Drâa-Tafilalet" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-4.5, 32.0], [-3.5, 32.0], [-2.0, 32.5], [-2.0, 29.5], [-5.5, 29.5], [-5.5, 31.5], [-4.5, 32.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "souss-massa", "name": "Souss-Massa" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-10.2, 31.0], [-8.0, 30.5], [-7.0, 31.0], [-7.0, 29.5], [-8.5, 29.0], [-10.2, 29.2], [-10.2, 31.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "guelmim-oued-noun", "name": "Guelmim-Oued Noun" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-10.5, 29.2], [-8.5, 29.0], [-8.5, 27.5], [-12.0, 27.5], [-12.5, 28.5], [-10.5, 29.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "laayoune-sakia-el-hamra", "name": "Laâyoune-Sakia El Hamra" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-12.5, 28.5], [-12.0, 27.5], [-8.5, 27.5], [-8.5, 24.5], [-14.0, 24.5], [-15.0, 27.0], [-12.5, 28.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "slug": "dakhla-oued-ed-dahab", "name": "Dakhla-Oued Ed-Dahab" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-14.0, 24.5], [-8.5, 24.5], [-8.5, 21.0], [-17.1, 21.0], [-17.1, 23.5], [-14.0, 24.5]]]
      }
    }
  ]
};

// Morocco bounding box [south, west, north, east]
export const MOROCCO_BOUNDS: [[number, number], [number, number]] = [
  [21.0, -17.5],
  [36.0, -1.0]
];
