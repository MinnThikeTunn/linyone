"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  Save,
  Shield,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
  Calendar,
  Navigation,
} from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    image: "",
    latitude: undefined,
    longitude: undefined,
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [userRole, setUserRole] = useState<string>("User");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Fetch fresh data from database to ensure we have latest profile info
      const fetchUserData = async () => {
        try {
          const tableName = user.isOrg ? "organizations" : "users";
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            setProfileData({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              address: data.address || "",
              image: data.image || "",
              latitude: data.latitude,
              longitude: data.longitude,
            });
            setImagePreview(data.image || "");

            // Fetch user's organization role if they are a regular user
            if (!user.isOrg) {
              try {
                const { data: orgMember, error: orgError } = await supabase
                  .from("org-member")
                  .select(`
                    type,
                    status,
                    organization_id,
                    organizations (
                      name
                    )
                  `)
                  .eq("user_id", user.id)
                  .eq("status", "active")
                  .single();

                if (!orgError && orgMember) {
                  const orgName = (orgMember as any).organizations?.name || "Unknown Organization";
                  const memberType = orgMember.type || "member";
                  setUserRole(`${memberType.charAt(0).toUpperCase() + memberType.slice(1)} at ${orgName}`);
                } else {
                  setUserRole(data.is_admin ? "Admin" : "User");
                }
              } catch (err) {
                console.log("User is not part of any organization");
                setUserRole(data.is_admin ? "Admin" : "User");
              }
            } else {
              setUserRole("Organization");
            }
          } else {
            // Fallback to cached user data
            setProfileData({
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              address: (user as any).address || "",
              image: user.image || "",
              latitude: (user as any).latitude,
              longitude: (user as any).longitude,
            });
            setImagePreview(user.image || "");
            setUserRole(user.role || user.accountType || "User");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          // Fallback to cached user data
          setProfileData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            address: (user as any).address || "",
            image: user.image || "",
            latitude: (user as any).latitude,
            longitude: (user as any).longitude,
          });
          setImagePreview(user.image || "");
          setUserRole(user.role || user.accountType || "User");
        }
      };

      fetchUserData();
    }
  }, [user]);

  const getCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setMessage(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      const address =
        data.display_name ||
        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setProfileData({
        ...profileData,
        address,
        latitude,
        longitude,
      });

      setMessage({
        type: "success",
        text: "Location detected successfully!",
      });
    } catch (error: any) {
      console.error("Location error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to get location. Please enter address manually.",
      });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      let imageUrl = profileData.image;

      // Upload image if changed - skip upload and use base64 or external URL instead
      if (imageFile) {
        try {
          // Convert image to base64 for now (temporary solution)
          // In production, you should use an external image hosting service
          const reader = new FileReader();
          imageUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          
          console.log("Image converted to base64 (stored locally)");
        } catch (imgError: any) {
          console.error("Image processing error:", imgError);
          setMessage({ 
            type: "error", 
            text: `Image error: ${imgError.message}. You can paste an image URL instead.` 
          });
          setIsSaving(false);
          return;
        }
      }

      // Determine which table to update based on account type
      const tableName = user?.isOrg ? "organizations" : "users";

      const updateData: any = {
        name: profileData.name,
        phone: profileData.phone,
      };

      // Only add optional fields if they have values or are being updated
      if (profileData.address !== undefined) {
        updateData.address = profileData.address;
      }
      if (imageUrl) {
        updateData.image = imageUrl;
      }
      if (profileData.latitude !== undefined) {
        updateData.latitude = profileData.latitude;
      }
      if (profileData.longitude !== undefined) {
        updateData.longitude = profileData.longitude;
      }

      const { error, data: updatedData } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", user?.id)
        .select();

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      console.log("Profile updated successfully:", updatedData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      setImageFile(null);

      // Update localStorage with new data
      if (updatedData && updatedData[0]) {
        const updatedUser = {
          ...user,
          name: updatedData[0].name,
          phone: updatedData[0].phone,
          image: updatedData[0].image,
          address: updatedData[0].address,
          latitude: updatedData[0].latitude,
          longitude: updatedData[0].longitude,
        };
        localStorage.setItem('linyone_user', JSON.stringify(updatedUser));
      }

      // Refresh user data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Profile update error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please check console for details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      setIsChangingPassword(false);
      return;
    }

    try {
      // Update password in Supabase Auth (if using Supabase Auth)
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to change password",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            My Profile
          </h1>
          <p className="text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert
            className={`mb-6 ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                message.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header Card */}
        <Card className="mb-6 border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6">
              {/* Avatar Section - Centered */}
              <div className="relative group">
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-100 shadow-md ring-4 ring-gray-50">
                  <AvatarImage
                    src={imagePreview || user.image}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-slate-200 to-gray-300 text-gray-700 text-4xl sm:text-5xl font-bold">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-white mx-auto mb-1" />
                      <span className="text-xs text-white font-medium">Change Photo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {!isEditing && user.image && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                )}
              </div>
              
              {/* User Info - Centered */}
              <div className="text-center w-full">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                  {user.name}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200">
                    <Mail className="w-3 h-3 mr-1" />
                    {user.email}
                  </Badge>
                  {user.phone && (
                    <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200">
                      <Phone className="w-3 h-3 mr-1" />
                      {user.phone}
                    </Badge>
                  )}
                  <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 capitalize">
                    {user.isOrg ? (
                      <Building className="w-3 h-3 mr-1" />
                    ) : (
                      <User className="w-3 h-3 mr-1" />
                    )}
                    {userRole}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Profile Information
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setImagePreview(user.image || "");
                        setImageFile(null);
                        setProfileData({
                          name: user.name || "",
                          email: user.email || "",
                          phone: user.phone || "",
                          address: (user as any).address || "",
                          image: user.image || "",
                        });
                      }}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="flex items-center gap-2 font-medium"
                      >
                        <User className="w-4 h-4 text-gray-600" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="transition-all disabled:bg-gray-50"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="Email cannot be changed"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Phone className="w-4 h-4 text-gray-600" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="transition-all disabled:bg-gray-50"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="address"
                        className="flex items-center gap-2 font-medium"
                      >
                        <MapPin className="w-4 h-4 text-gray-600" />
                        Address
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              address: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="transition-all disabled:bg-gray-50"
                          placeholder="Enter your address or use current location"
                        />
                        {isEditing && (
                          <Button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isFetchingLocation}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                          >
                            {isFetchingLocation ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Navigation className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setImagePreview(user.image || "");
                          setImageFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Shield className="w-5 h-5 text-slate-600" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Lock className="w-4 h-4 text-gray-600" />
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Lock className="w-4 h-4 text-gray-600" />
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Lock className="w-4 h-4 text-gray-600" />
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-slate-700 hover:bg-slate-800 text-white"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
