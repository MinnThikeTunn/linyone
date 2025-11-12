"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Plus, 
  AlertTriangle, 
  Shield, 
  Users, 
  Building,
  Navigation,
  Upload,
  X,
  Check,
  Clock,
  Eye,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

// Add Mapbox GL JS
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiZWlteWF0bW9uIiwiYSI6ImNtaHM3c2JtODBxbHMycnI4dTljeTBhOGMifQ.hvR26kiNlnorTCJ1hdN5nQ";

interface Pin {
  id: string;
  type: "damaged" | "safe";
  status: "pending" | "confirmed" | "completed";
  phone: string;
  description: string;
  lat: number;
  lng: number;
  createdBy: string;
  createdAt: Date;
  image?: string;
  assignedTo?: string;
  items?: {
    peopleHurt?: number;
    foodPacks?: number;
    waterBottles?: number;
    medicineBox?: number;
    clothesPacks?: number;
    blankets?: number;
  };
}

// Define User interface to match useAuth hook
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "tracking_volunteer" | "supply_volunteer" | "user"; // Add role property
}

// Mock data for demonstration
const mockPins: Pin[] = [
  {
    id: "1",
    type: "damaged",
    status: "confirmed",
    // title: "Building Collapse",
    phone: "09786993797",
    description: "Multi-story building collapsed, need immediate rescue",
    lat: 16.8409,
    lng: 96.1735,
    createdBy: "Volunteer Team A",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assignedTo: "Rescue Team B",
  },
  {
    id: "2",
    type: "safe",
    status: "confirmed",
    phone: "09786993797",
    description: "School gym converted to emergency shelter",
    lat: 16.8509,
    lng: 96.1835,
    createdBy: "City Authority",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "damaged",
    status: "pending",
    phone: "09786993797",
    description: "Major road blocked by fallen trees",
    lat: 16.8309,
    lng: 96.1635,
    createdBy: "Anonymous User",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export default function HomePage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [pins, setPins] = useState<Pin[]>(mockPins);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinType, setPinType] = useState<"damaged" | "safe">("damaged");
  const [pinPhone, setPinPhone] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [pinImage, setPinImage] = useState<File | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 16.8409,
    lng: 96.1735,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showConfirmPinDialog, setShowConfirmPinDialog] = useState(false);
  const [showPinListDialog, setShowPinListDialog] = useState(false);
  const [pinToConfirm, setPinToConfirm] = useState<Pin | null>(null);
  const [itemQuantities, setItemQuantities] = useState<{
    peopleHurt: { checked: boolean; quantity: number };
    foodPacks: { checked: boolean; quantity: number };
    waterBottles: { checked: boolean; quantity: number };
    medicineBox: { checked: boolean; quantity: number };
    clothesPacks: { checked: boolean; quantity: number };
    blankets: { checked: boolean; quantity: number };
  }>({
    peopleHurt: { checked: false, quantity: 0 },
    foodPacks: { checked: false, quantity: 0 },
    waterBottles: { checked: false, quantity: 0 },
    medicineBox: { checked: false, quantity: 0 },
    clothesPacks: { checked: false, quantity: 0 },
    blankets: { checked: false, quantity: 0 },
  });
  const [emergencyKitItems, setEmergencyKitItems] = useState<Record<string, boolean>>({
    water: false,
    food: false,
    flashlight: false,
    firstAid: false,
    batteries: false,
    radio: false,
    whistle: false,
    dustMask: false,
    plasticSheeting: false,
    ductTape: false,
    canOpener: false,
    localMaps: false,
    cellPhone: false,
    charger: false,
    cash: false,
    importantDocuments: false,
    warmClothing: false,
    blankets: false,
    tools: false,
    sanitation: false,
  });

  // Mapbox map reference
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const tempMarker = useRef<mapboxgl.Marker | null>(null);

  // Type-safe user role check
  const userRole = (user as User)?.role;

  // Move filteredPins declaration here, before the useEffect that uses it
  const filteredPins = pins.filter((pin) => {
    if (userRole === "supply_volunteer") {
      return pin.status === "confirmed" && pin.type === "damaged";
    }
    return true;
  });

  useEffect(() => {
    // Initialize Mapbox map
    if (!map.current && mapContainer.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [mapCenter.lng, mapCenter.lat],
          zoom: 12,
        });

        // Add navigation control
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Handle map load
        map.current.on("load", () => {
          setMapLoading(false);

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                setUserLocation(location);
                setMapCenter(location);

                // Update map center
                if (map.current) {
                  map.current.flyTo({
                    center: [location.lng, location.lat],
                    zoom: 14,
                  });

                  // Add user location marker
                  userMarker.current = new mapboxgl.Marker({
                    color: "#3B82F6",
                  })
                    .setLngLat([location.lng, location.lat])
                    .addTo(map.current!);
                }
        },
        (error) => {
                console.error("Error getting location:", error);
              }
            );
          }
        });

        // Handle map click for selecting new pin location
        map.current.on("click", (e) => {
          if (isSelectingLocation) {
            const { lng, lat } = e.lngLat;
            setNewPinLocation({ lat, lng });

            // Remove previous temp marker
            if (tempMarker.current) {
              tempMarker.current.remove();
            }

            // Add temp marker
            tempMarker.current = new mapboxgl.Marker({
              color: "#9333EA",
            })
              .setLngLat([lng, lat])
              .addTo(map.current!);
          }
        });

        // Handle map error
        map.current.on("error", (e) => {
          console.error("Mapbox error:", e);
          setMapError("Failed to load map. Please try again later.");
          setMapLoading(false);
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          if (map.current) {
            map.current.resize();
          }
        });

        if (mapContainer.current) {
          resizeObserver.observe(mapContainer.current);
        }

        return () => {
          resizeObserver.disconnect();
        };
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to initialize map. Please try again later.");
        setMapLoading(false);
      }
    }

    return () => {
      // Clean up map on unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when pins change
  useEffect(() => {
    if (!map.current || mapLoading) return;

    // Remove all existing markers
    Object.values(markers.current).forEach((marker) => marker.remove());
    markers.current = {};

    // Add markers for each pin
    filteredPins.forEach((pin) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "cursor-pointer";

      // Create marker based on pin type
      const markerDiv = document.createElement("div");
      markerDiv.className = `w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
        pin.type === "damaged" ? "bg-red-500" : "bg-green-500"
      }`;

      // Add icon
      const icon = document.createElement("div");
      if (pin.type === "damaged") {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      } else {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      }
      markerDiv.appendChild(icon);

      // Add status indicator
      const statusDiv = document.createElement("div");
      statusDiv.className = `absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${
        pin.status === "pending"
          ? "bg-yellow-400"
          : pin.status === "confirmed"
          ? "bg-green-400"
          : "bg-blue-400"
      }`;

      el.appendChild(markerDiv);
      el.appendChild(statusDiv);

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div class="p-2">
          <div class="font-semibold">${pin.phone}</div>
          <div class="text-sm text-gray-600">${pin.description}</div>
          <div class="mt-1">
            <span class="text-xs px-2 py-1 rounded-full ${
              pin.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : pin.status === "confirmed"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }">${pin.status}</span>
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click event
      el.addEventListener("click", () => {
        setSelectedPin(pin);
      });

      // Store marker reference
      markers.current[pin.id] = marker;
    });
  }, [filteredPins, mapLoading]);

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);

          // Update map center
          if (map.current) {
            map.current.flyTo({
              center: [location.lng, location.lat],
              zoom: 14,
            });

            // Update user marker
            if (userMarker.current) {
              userMarker.current.setLngLat([location.lng, location.lat]);
            } else {
              userMarker.current = new mapboxgl.Marker({
                color: "#3B82F6",
              })
                .setLngLat([location.lng, location.lat])
                .addTo(map.current!);
            }
          }

          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
        }
      );
    }
  };

  const handleCreatePin = () => {
    if (!pinPhone || !pinDescription) return;

    // Use selected location or map center
    const location = newPinLocation || mapCenter;

    const newPin: Pin = {
      id: Date.now().toString(),
      type: pinType,
      status: userRole === "tracking_volunteer" ? "confirmed" : "pending",
      phone: pinPhone,
      description: pinDescription,
      lat: location.lat,
      lng: location.lng,
      createdBy: user?.name || "Anonymous User",
      createdAt: new Date(),
      image: pinImage ? URL.createObjectURL(pinImage) : undefined,
    };

    setPins([newPin, ...pins]);
    setPinPhone("");
    setPinDescription("");
    setPinImage(null);
    setShowPinDialog(false);
    setNewPinLocation(null);
    setIsSelectingLocation(false);

    // Remove temp marker
    if (tempMarker.current) {
      tempMarker.current.remove();
      tempMarker.current = null;
    }

    // Fly to new pin location
    if (map.current) {
      map.current.flyTo({
        center: [newPin.lng, newPin.lat],
        zoom: 14,
      });
    }
  };


  const handleDenyPin = (pinId: string) => {
    setPins(pins.filter((pin) => pin.id !== pinId));
  };

  const handleMarkCompleted = (pinId: string) => {
    setPins(
      pins.map((pin) =>
        pin.id === pinId ? { ...pin, status: "completed" } : pin
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "confirmed":
        return <Check className="w-3 h-3" />;
      case "completed":
        return <Shield className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Get nearby unconfirmed pins (within 5km radius)
  const getNearbyUnconfirmedPins = () => {
    if (!userLocation) return [];
    
    return pins.filter((pin) => {
      if (pin.status !== "pending") return false;
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((pin.lat - userLocation.lat) * Math.PI) / 180;
      const dLon = ((pin.lng - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((pin.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= 5; // 5km radius
    });
  };

  const handleConfirmPinClick = () => {
    if (!userLocation) {
      alert("Please get your current location first");
      return;
    }
    setShowPinListDialog(true);
  };

  const handleSelectPinToConfirm = (pin: Pin) => {
    setPinToConfirm(pin);
    setShowPinListDialog(false);
    setShowConfirmPinDialog(true);
    // Reset item quantities
    setItemQuantities({
      peopleHurt: { checked: false, quantity: 0 },
      foodPacks: { checked: false, quantity: 0 },
      waterBottles: { checked: false, quantity: 0 },
      medicineBox: { checked: false, quantity: 0 },
      clothesPacks: { checked: false, quantity: 0 },
      blankets: { checked: false, quantity: 0 },
    });
  };

  const handleItemCheckboxChange = (item: keyof typeof itemQuantities, checked: boolean) => {
    setItemQuantities((prev) => ({
      ...prev,
      [item]: {
        checked,
        quantity: checked ? prev[item].quantity : 0,
      },
    }));
  };

  const handleQuantityChange = (item: keyof typeof itemQuantities, delta: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [item]: {
        ...prev[item],
        quantity: Math.max(0, prev[item].quantity + delta),
      },
    }));
  };

  const handleConfirmPin = () => {
    if (!pinToConfirm) return;

    const items: Pin["items"] = {};
    if (itemQuantities.peopleHurt.checked && itemQuantities.peopleHurt.quantity > 0) {
      items.peopleHurt = itemQuantities.peopleHurt.quantity;
    }
    if (itemQuantities.foodPacks.checked && itemQuantities.foodPacks.quantity > 0) {
      items.foodPacks = itemQuantities.foodPacks.quantity;
    }
    if (itemQuantities.waterBottles.checked && itemQuantities.waterBottles.quantity > 0) {
      items.waterBottles = itemQuantities.waterBottles.quantity;
    }
    if (itemQuantities.medicineBox.checked && itemQuantities.medicineBox.quantity > 0) {
      items.medicineBox = itemQuantities.medicineBox.quantity;
    }
    if (itemQuantities.clothesPacks.checked && itemQuantities.clothesPacks.quantity > 0) {
      items.clothesPacks = itemQuantities.clothesPacks.quantity;
    }
    if (itemQuantities.blankets.checked && itemQuantities.blankets.quantity > 0) {
      items.blankets = itemQuantities.blankets.quantity;
    }

    setPins(
      pins.map((pin) =>
        pin.id === pinToConfirm.id
          ? { ...pin, status: "confirmed" as const, items }
          : pin
      )
    );

    setShowConfirmPinDialog(false);
    setPinToConfirm(null);
    setItemQuantities({
      peopleHurt: { checked: false, quantity: 0 },
      foodPacks: { checked: false, quantity: 0 },
      waterBottles: { checked: false, quantity: 0 },
      medicineBox: { checked: false, quantity: 0 },
      clothesPacks: { checked: false, quantity: 0 },
      blankets: { checked: false, quantity: 0 },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
      {/* Header */}
            <div className="max-w-7xl mx-auto py-4">
              {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"> */}
              <div className={`flex items-center gap-2 w-full ${userRole === "tracking_volunteer" ? "flex-wrap" : ""}`}>
              <Button
                variant="outline"
                size={userRole === "tracking_volunteer" ? "sm" : "default"}
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                  className={`flex items-center lg:gap-2 ${userRole === "tracking_volunteer" ? "" : "flex-1 h-12"}`}
                  style={userRole === "tracking_volunteer" ? { flex: "1" } : {}}
              >
                  <Navigation className="w-5 h-5" />
                  {t("map.currentLocation")}
              </Button>
              
                {userRole === "tracking_volunteer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConfirmPinClick}
                    className="flex items-center lg:gap-2 bg-green-600 text-white hover:bg-green-700"
                    style={{ flex: "1" }}
                  >
                    <Check className="w-5 h-5" />
                    Confirm Pin
                  </Button>
                )}

                <Dialog
                  open={showPinDialog}
                  onOpenChange={(open) => {
                    setShowPinDialog(open);
                    if (!open) {
                      setNewPinLocation(null);
                      setIsSelectingLocation(false);
                      if (tempMarker.current) {
                        tempMarker.current.remove();
                        tempMarker.current = null;
                      }
                    }
                  }}
                >
                <DialogTrigger asChild>
                    <Button
                      // variant="outline"
                      size={userRole === "tracking_volunteer" ? "sm" : "default"}
                      className={`flex items-center gap-2 bg-black ${userRole === "tracking_volunteer" ? "w-1/2" : "flex-1 h-12"}`}
                    >
                    <Plus className="w-4 h-4" />
                      {t("map.addPin")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>{t("map.title")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                        <Select
                          value={pinType}
                          onValueChange={(value: "damaged" | "safe") =>
                            setPinType(value)
                          }
                        >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="damaged">
                              {t("map.damagedLocation")}
                            </SelectItem>
                            <SelectItem value="safe">
                              {t("map.safeZone")}
                            </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                        <Label htmlFor="pin-title" className="mb-2">
                          Phone No
                        </Label>
                      <Input
                        id="pin-title"
                          value={pinPhone}
                          onChange={(e) => setPinPhone(e.target.value)}
                          placeholder="Enter Phone..."
                      />
                    </div>
                    
                    <div>
                        <Label htmlFor="pin-description" className="mb-2">
                          {t("map.description")}
                        </Label>
                      <Textarea
                        id="pin-description"
                        value={pinDescription}
                        onChange={(e) => setPinDescription(e.target.value)}
                        placeholder="Describe the situation..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                        <Label htmlFor="pin-image" className="mb-2">
                          {t("map.uploadImage")}
                        </Label>
                      <Input
                        id="pin-image"
                        type="file"
                        accept="image/*"
                          onChange={(e) =>
                            setPinImage(e.target.files?.[0] || null)
                          }
                      />
                    </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsSelectingLocation(true);
                            setShowPinDialog(false);
                          }}
                          className="flex-1"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {newPinLocation ? "Change Location" : "Select on Map"}
                        </Button>
                      </div>

                      {newPinLocation && (
                        <div className="text-sm text-gray-600">
                          Selected location: {newPinLocation.lat.toFixed(6)},{" "}
                          {newPinLocation.lng.toFixed(6)}
                        </div>
                      )}
                    
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePin} className="flex-1">
                          {t("map.submit")}
                      </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowPinDialog(false)}
                        >
                          {t("map.cancel")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
              {/* </div> */}
          </div>

            <Card className="h-[800px] py-0">
              <CardContent className="p-0 h-full relative">
                {/* Mapbox Map */}
                <div
                  ref={mapContainer}
                  className="h-full w-full rounded-lg overflow-hidden"
                />

                {/* Map Loading State */}
                {mapLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
                )}

                {/* Map Error State */}
                {mapError && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center max-w-md p-4">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">{mapError}</p>
                      <Button
                        onClick={() => window.location.reload()}
                        className="mt-4"
                      >
                        Reload Page
                      </Button>
                    </div>
                      </div>
                    )}
                    
                {/* Location Selection Indicator */}
                {isSelectingLocation && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <p className="text-sm">
                        Click on the map to select a location for your pin
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsSelectingLocation(false);
                        setShowPinDialog(true);
                      }}
                      className="mt-2 w-full"
                    >
                      Done
                    </Button>
                        </div>
                )}
                  
                  {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
                    <h3 className="text-sm font-semibold mb-2">Legend</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                      <span>{t("map.damagedLocation")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                      <span>{t("map.safeZone")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <span>{t("map.pending")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                      <span>{t("map.confirmed")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      <span>{t("map.completed")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {pins.filter((p) => p.type === "damaged").length}
                    </div>
                    <div className="text-sm text-gray-600">Damaged Areas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pins.filter((p) => p.type === "safe").length}
                    </div>
                    <div className="text-sm text-gray-600">Safe Zones</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Pins */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPins.slice(0, 5).map((pin) => (
                    <div
                      key={pin.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSelectedPin(pin);
                        // Fly to pin location on map
                        if (map.current) {
                          map.current.flyTo({
                            center: [pin.lng, pin.lat],
                            zoom: 15,
                          });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {pin.type === "damaged" ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-green-500" />
                            )}
                            <span className="font-medium text-sm">
                              {pin.type === "damaged" ? "Damaged Location" : "Safe Zone"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {pin.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              className={`text-xs ${getStatusColor(
                                pin.status
                              )}`}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(pin.status)}
                                <span>{t(`map.${pin.status}`)}</span>
                              </div>
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {pin.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      

                      {userRole === "supply_volunteer" &&
                        pin.status === "confirmed" &&
                        pin.type === "damaged" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkCompleted(pin.id);
                            }}
                            className="w-full mt-2"
                          >
                          <Check className="w-3 h-3 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Kit Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Emergency Kit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="water"
                      checked={emergencyKitItems.water}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, water: checked as boolean }))
                      }
                    />
                    <Label htmlFor="water" className="text-sm font-normal cursor-pointer">
                      Water (1 gallon per person per day)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="food"
                      checked={emergencyKitItems.food}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, food: checked as boolean }))
                      }
                    />
                    <Label htmlFor="food" className="text-sm font-normal cursor-pointer">
                      Non-perishable food (3-day supply)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="flashlight"
                      checked={emergencyKitItems.flashlight}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, flashlight: checked as boolean }))
                      }
                    />
                    <Label htmlFor="flashlight" className="text-sm font-normal cursor-pointer">
                      Flashlight
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstAid"
                      checked={emergencyKitItems.firstAid}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, firstAid: checked as boolean }))
                      }
                    />
                    <Label htmlFor="firstAid" className="text-sm font-normal cursor-pointer">
                      First aid supplies
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="batteries"
                      checked={emergencyKitItems.batteries}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, batteries: checked as boolean }))
                      }
                    />
                    <Label htmlFor="batteries" className="text-sm font-normal cursor-pointer">
                      Extra batteries
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="radio"
                      checked={emergencyKitItems.radio}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, radio: checked as boolean }))
                      }
                    />
                    <Label htmlFor="radio" className="text-sm font-normal cursor-pointer">
                      Battery-powered or hand-crank radio
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whistle"
                      checked={emergencyKitItems.whistle}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, whistle: checked as boolean }))
                      }
                    />
                    <Label htmlFor="whistle" className="text-sm font-normal cursor-pointer">
                      Whistle (to signal for help)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dustMask"
                      checked={emergencyKitItems.dustMask}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, dustMask: checked as boolean }))
                      }
                    />
                    <Label htmlFor="dustMask" className="text-sm font-normal cursor-pointer">
                      Dust mask
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="plasticSheeting"
                      checked={emergencyKitItems.plasticSheeting}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, plasticSheeting: checked as boolean }))
                      }
                    />
                    <Label htmlFor="plasticSheeting" className="text-sm font-normal cursor-pointer">
                      Plastic sheeting and duct tape
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canOpener"
                      checked={emergencyKitItems.canOpener}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, canOpener: checked as boolean }))
                      }
                    />
                    <Label htmlFor="canOpener" className="text-sm font-normal cursor-pointer">
                      Manual can opener
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="localMaps"
                      checked={emergencyKitItems.localMaps}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, localMaps: checked as boolean }))
                      }
                    />
                    <Label htmlFor="localMaps" className="text-sm font-normal cursor-pointer">
                      Local maps
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cellPhone"
                      checked={emergencyKitItems.cellPhone}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, cellPhone: checked as boolean }))
                      }
                    />
                    <Label htmlFor="cellPhone" className="text-sm font-normal cursor-pointer">
                      Cell phone with charger
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cash"
                      checked={emergencyKitItems.cash}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, cash: checked as boolean }))
                      }
                    />
                    <Label htmlFor="cash" className="text-sm font-normal cursor-pointer">
                      Cash or traveler's checks
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importantDocuments"
                      checked={emergencyKitItems.importantDocuments}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, importantDocuments: checked as boolean }))
                      }
                    />
                    <Label htmlFor="importantDocuments" className="text-sm font-normal cursor-pointer">
                      Important documents (copies)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="warmClothing"
                      checked={emergencyKitItems.warmClothing}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, warmClothing: checked as boolean }))
                      }
                    />
                    <Label htmlFor="warmClothing" className="text-sm font-normal cursor-pointer">
                      Warm clothing and blankets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tools"
                      checked={emergencyKitItems.tools}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, tools: checked as boolean }))
                      }
                    />
                    <Label htmlFor="tools" className="text-sm font-normal cursor-pointer">
                      Basic tools (wrench, pliers)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sanitation"
                      checked={emergencyKitItems.sanitation}
                      onCheckedChange={(checked) =>
                        setEmergencyKitItems(prev => ({ ...prev, sanitation: checked as boolean }))
                      }
                    />
                    <Label htmlFor="sanitation" className="text-sm font-normal cursor-pointer">
                      Sanitation and personal hygiene items
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pin Detail Dialog */}
      {selectedPin && (
        <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPin.type === "damaged" ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Shield className="w-5 h-5 text-green-500" />
                )}
                {selectedPin.phone}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Badge className={`${getStatusColor(selectedPin.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedPin.status)}
                    <span>{t(`map.${selectedPin.status}`)}</span>
                  </div>
                </Badge>
              </div>
              
              <p className="text-gray-700">{selectedPin.description}</p>
              
              {selectedPin.image && (
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPin.image} 
                    alt={selectedPin.phone}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <div>Reported by: {selectedPin.createdBy}</div>
                <div>Time: {selectedPin.createdAt.toLocaleString()}</div>
                {selectedPin.assignedTo && (
                  <div>Assigned to: {selectedPin.assignedTo}</div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                
                {userRole === "supply_volunteer" &&
                  selectedPin.status === "confirmed" &&
                  selectedPin.type === "damaged" && (
                    <Button
                      onClick={() => handleMarkCompleted(selectedPin.id)}
                      className="w-full"
                    >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pin List Dialog for Tracker Volunteers */}
      {userRole === "tracking_volunteer" && (
        <Dialog open={showPinListDialog} onOpenChange={setShowPinListDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nearby Unconfirmed Pins</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getNearbyUnconfirmedPins().length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No unconfirmed pins found nearby. Please get your current location first.
                </p>
              ) : (
                getNearbyUnconfirmedPins().map((pin) => (
                  <Card
                    key={pin.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectPinToConfirm(pin)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {pin.type === "damaged" ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-green-500" />
                            )}
                            <span className="font-medium">{pin.type === "damaged" ? "Damaged Location" : "Safe Zone"}</span>
    </div>
                          <p className="text-sm text-gray-600 mb-2">{pin.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Phone: {pin.phone}</span>
                            <span>Reporter: {pin.createdBy}</span>
                            <span>{pin.createdAt.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Pin Dialog */}
      {userRole === "tracking_volunteer" && pinToConfirm && (
        <Dialog open={showConfirmPinDialog} onOpenChange={setShowConfirmPinDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Pin Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Pin Details */}
              <div className="space-y-2 border-b pb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{pinToConfirm.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(pinToConfirm.status)}>
                    {pinToConfirm.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm">{pinToConfirm.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Reporter</Label>
                  <p className="text-sm">{pinToConfirm.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Timestamp</Label>
                  <p className="text-sm">{pinToConfirm.createdAt.toLocaleString()}</p>
                </div>
              </div>

              {/* Item Checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Required Items</Label>
                
                {/* People Hurt */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.peopleHurt.checked}
                    onChange={(e) => handleItemCheckboxChange("peopleHurt", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">People Hurt</Label>
                  {itemQuantities.peopleHurt.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("peopleHurt", -1)}
                        disabled={itemQuantities.peopleHurt.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.peopleHurt.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("peopleHurt", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>

                {/* Food Packs */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.foodPacks.checked}
                    onChange={(e) => handleItemCheckboxChange("foodPacks", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">Food Packs</Label>
                  {itemQuantities.foodPacks.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("foodPacks", -1)}
                        disabled={itemQuantities.foodPacks.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.foodPacks.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("foodPacks", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>

                {/* Water Bottles */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.waterBottles.checked}
                    onChange={(e) => handleItemCheckboxChange("waterBottles", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">Water Bottles</Label>
                  {itemQuantities.waterBottles.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("waterBottles", -1)}
                        disabled={itemQuantities.waterBottles.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.waterBottles.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("waterBottles", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>

                {/* Medicine Box */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.medicineBox.checked}
                    onChange={(e) => handleItemCheckboxChange("medicineBox", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">Medicine Box</Label>
                  {itemQuantities.medicineBox.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("medicineBox", -1)}
                        disabled={itemQuantities.medicineBox.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.medicineBox.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("medicineBox", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>

                {/* Clothes Packs */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.clothesPacks.checked}
                    onChange={(e) => handleItemCheckboxChange("clothesPacks", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">Clothes Packs</Label>
                  {itemQuantities.clothesPacks.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("clothesPacks", -1)}
                        disabled={itemQuantities.clothesPacks.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.clothesPacks.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("clothesPacks", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>

                {/* Blankets */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={itemQuantities.blankets.checked}
                    onChange={(e) => handleItemCheckboxChange("blankets", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label className="flex-1 cursor-pointer">Blankets</Label>
                  {itemQuantities.blankets.checked && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("blankets", -1)}
                        disabled={itemQuantities.blankets.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{itemQuantities.blankets.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange("blankets", 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Button */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleConfirmPin} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Pin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmPinDialog(false);
                    setPinToConfirm(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
