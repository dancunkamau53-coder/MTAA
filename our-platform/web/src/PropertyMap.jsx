import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

// Fix Leaflet marker icons when using Vite/React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function PropertyMap({
  latitude,
  longitude,
  title = "MTAA Property",
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return (
      <div className="property-map-empty">
        <strong>Location unavailable</strong>

        <p>
          This property does not have valid
          map coordinates yet.
        </p>
      </div>
    );
  }

  return (
    <div className="property-map-wrapper">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={true}
        className="property-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{title}</strong>

            <br />

            MTAA property location.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default PropertyMap;