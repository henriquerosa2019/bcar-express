import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BCAR = { lat: -22.9249, lng: -43.2373 };

const iconBcar = L.divIcon({
  className: "",
  html: `<div style="background:#ff5c1a;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 3px rgba(255,92,26,.3)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

const iconMoto = L.divIcon({
  className: "",
  html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">🏍️</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const iconDest = L.divIcon({
  className: "",
  html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,.3)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

export default function MapView({ motoCoords, destLabel }) {
  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const motoMkRef  = useRef(null);
  const lineRef    = useRef(null);

  useEffect(() => {
    if (mapObjRef.current) return;
    const center = motoCoords || BCAR;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Bcar marker
    L.marker([BCAR.lat, BCAR.lng], { icon: iconBcar })
      .addTo(map)
      .bindPopup("⚡ Bcar Autopeças – Tijuca");

    // Motoboy marker
    if (motoCoords) {
      motoMkRef.current = L.marker([motoCoords.lat, motoCoords.lng], { icon: iconMoto })
        .addTo(map)
        .bindPopup("🏍️ Motoboy");

      // line from bcar to moto
      lineRef.current = L.polyline(
        [[BCAR.lat, BCAR.lng], [motoCoords.lat, motoCoords.lng]],
        { color: "#ff5c1a", weight: 2, dashArray: "6,6", opacity: 0.7 }
      ).addTo(map);

      map.fitBounds([[BCAR.lat, BCAR.lng], [motoCoords.lat, motoCoords.lng]], { padding: [40, 40] });
    }

    mapObjRef.current = map;
  }, []);

  // update motoboy position
  useEffect(() => {
    if (!mapObjRef.current || !motoCoords) return;
    const pos = [motoCoords.lat, motoCoords.lng];
    if (motoMkRef.current) {
      motoMkRef.current.setLatLng(pos);
    } else {
      motoMkRef.current = L.marker(pos, { icon: iconMoto })
        .addTo(mapObjRef.current)
        .bindPopup("🏍️ Motoboy");
    }
    if (lineRef.current) {
      lineRef.current.setLatLngs([[BCAR.lat, BCAR.lng], pos]);
    } else {
      lineRef.current = L.polyline([[BCAR.lat, BCAR.lng], pos], {
        color: "#ff5c1a", weight: 2, dashArray: "6,6", opacity: 0.7,
      }).addTo(mapObjRef.current);
    }
    mapObjRef.current.panTo(pos);
  }, [motoCoords]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: 300, borderRadius: 12, overflow: "hidden", border: "1px solid #252830" }} />
      <div style={{
        position: "absolute", top: 10, right: 10, background: "#111318",
        border: "1px solid #252830", borderRadius: 8, padding: "6px 12px",
        fontSize: 12, zIndex: 1000, display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "gpspulse 1.5s infinite" }} />
        Ao vivo · 3 min
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 14, fontSize: 12, color: "#6b7280" }}>
        <span><span style={{ color: "#ff5c1a" }}>●</span> Bcar Tijuca</span>
        {motoCoords && <span>🏍️ Motoboy</span>}
      </div>
    </div>
  );
}
