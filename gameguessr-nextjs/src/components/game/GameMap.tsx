'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import des icônes Leaflet
import L from 'leaflet';

// Configuration des icônes par défaut
const DefaultIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number } | null;
  showCorrectLocation?: boolean;
  gameMapImages?: string[];
  className?: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  
  return null;
}

export default function GameMap({ 
  onLocationSelect, 
  selectedLocation, 
  correctLocation,
  showCorrectLocation = false,
  gameMapImages = [],
  className = '' 
}: GameMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white">Chargement de la carte...</div>
      </div>
    );
  }

  // Position par défaut (centré sur le monde du jeu ou monde réel)
  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris par défaut
  const defaultZoom = 2;

  // Pour les jeux comme Cyberpunk, on utiliserait une carte custom
  // Ici on utilise OpenStreetMap comme exemple
  
  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {/* Marqueur de la position sélectionnée par l'utilisateur */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={L.icon({
              iconUrl: '/leaflet/marker-icon.png',
              shadowUrl: '/leaflet/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              className: 'selected-marker'
            })}
          />
        )}
        
        {/* Marqueur de la position correcte (affiché après réponse) */}
        {showCorrectLocation && correctLocation && (
          <Marker
            position={[correctLocation.lat, correctLocation.lng]}
            icon={L.icon({
              iconUrl: '/leaflet/marker-icon.png',
              shadowUrl: '/leaflet/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              className: 'correct-marker'
            })}
          />
        )}
      </MapContainer>
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded">
        Cliquez sur la carte pour placer votre marqueur
      </div>
      
      {/* Distance si les deux marqueurs sont visibles */}
      {showCorrectLocation && selectedLocation && correctLocation && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-2 rounded">
          <div>Distance: {calculateDistance(selectedLocation, correctLocation).toFixed(0)}m</div>
        </div>
      )}
    </div>
  );
}

// Calcul de distance entre deux points (approximation simple)
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
