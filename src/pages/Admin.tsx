import React, { useEffect, useRef } from 'react';

// Import Leaflet and its CSS
import L, { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import GeoJSON types for type safety
import { FeatureCollection } from 'geojson';

// --- Data ---
const geojsonFeature: FeatureCollection = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Turn 1"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-106.39248, 39.62495]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Turn 2"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-106.39139, 39.63012]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Turn 3 (Hairpin)"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-106.39493, 39.63287]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Turn 4"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-106.38918, 39.63663]
            }
        }
    ]
}

const LeafletMap = () => {
    const mapRef = useRef<Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            // 1. Create the map instance (without setting a view yet)
            const map = L.map(mapContainerRef.current);
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // 2. Create the GeoJSON layer and add it to the map
            const geojsonLayer = L.geoJSON(geojsonFeature, {
                onEachFeature: (feature, layer) => {
                    if (feature.properties?.name) { 
                        layer.bindPopup(feature.properties.name);
                    }
                }
            }).addTo(map);

            // 3. Fit the map to the bounds of the GeoJSON layer
            map.fitBounds(geojsonLayer.getBounds());
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }} />
    );
};


export default function Admin() {
  return (
    <div className="bg-gray-100 font-sans leading-normal tracking-normal">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            City Locations in the US
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            This is an interactive map showing several major US cities. Click on a marker to see the city's name.
          </p>
          <div style={{ height: '500px', width: '100%' }}>
            <LeafletMap />
          </div>
        </div>
      </div>
    </div>
  );
}