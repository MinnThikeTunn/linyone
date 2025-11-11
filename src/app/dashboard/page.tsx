"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  MessageCircle,
  Navigation,
  Lock,
  Play,
  Award,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  uniqueId: string;
  lastSeen: Date;
  status: "safe" | "unknown" | "in_danger";
  location?: { lat: number; lng: number; address: string };
}

interface SafetyModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  progress: number;
  isLocked: boolean;
  badge?: string;
  icon: React.ReactNode;
}

// Mock data
const mockFamilyMembers: FamilyMember[] = [
  {
    id: "1",
    name: "Mother",
    phone: "+959123456789",
    uniqueId: "FAM-001",
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    status: "safe",
    location: { lat: 16.8409, lng: 96.1735, address: "Yangon, Myanmar" },
  },
  {
    id: "2",
    name: "Brother",
    phone: "+959987654321",
    uniqueId: "FAM-002",
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "unknown",
  },
  {
    id: "3",
    name: "Sister",
    phone: "+959456789123",
    uniqueId: "FAM-003",
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    status: "safe",
    location: { lat: 16.8509, lng: 96.1835, address: "Mandalay, Myanmar" },
  },
];

const mockSafetyModules: SafetyModule[] = [
  {
    id: "1",
    title: "CPR Training",
    description: "Learn life-saving cardiopulmonary resuscitation techniques",
    category: "First Aid",
    duration: "15 min",
    progress: 100,
    isLocked: false,
    badge: "CPR Certified",
    icon: <Heart className="w-6 h-6 text-red-500" />,
  },
  {
    id: "2",
    title: "First Aid Basics",
    description: "Essential first aid skills for emergency situations",
    category: "First Aid",
    duration: "20 min",
    progress: 60,
    isLocked: false,
    icon: <Shield className="w-6 h-6 text-blue-500" />,
  },
  {
    id: "3",
    title: "Earthquake Safety",
    description: "What to do before, during, and after an earthquake",
    category: "Emergency",
    duration: "10 min",
    progress: 30,
    isLocked: false,
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
  },
  {
    id: "4",
    title: "Emergency Preparedness",
    description: "How to prepare your family and home for disasters",
    category: "Preparedness",
    duration: "25 min",
    progress: 0,
    isLocked: false,
    icon: <Settings className="w-6 h-6 text-green-500" />,
  },
  {
    id: "5",
    title: "Advanced Rescue Techniques",
    description: "Professional rescue methods for volunteers",
    category: "Advanced",
    duration: "45 min",
    progress: 0,
    isLocked: true,
    icon: <Lock className="w-6 h-6 text-gray-500" />,
  },
];

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [familyMembers, setFamilyMembers] =
    useState<FamilyMember[]>(mockFamilyMembers);
  const [safetyModules, setSafetyModules] =
    useState<SafetyModule[]>(mockSafetyModules);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    uniqueId: "",
  });
  const [emergencyKitStatus, setEmergencyKitStatus] = useState(75);

  //family member
  const handleAddFamilyMember = () => {
    if (!newMember.name || !newMember.phone) return;

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name,
      phone: newMember.phone,
      uniqueId: "FAM-" + Math.random().toString(36).substr(2, 3).toUpperCase(),
      lastSeen: new Date(),
      status: "unknown",
    };

    setFamilyMembers([...familyMembers, member]);
    setNewMember({ name: "", phone: "", uniqueId: "" });
    setShowAddMember(false);
  };

  //check safety check
  const handleSendSafetyCheck = (memberId: string) => {
    // In a real app, this would send a notification
    alert(
      "Safety check sent to " +
        familyMembers.find((m) => m.id === memberId)?.name
    );
  };

  //mark safety
  const handleMarkSafe = (memberId: string) => {
    setFamilyMembers(
      familyMembers.map((member) =>
        member.id === memberId
          ? { ...member, status: "safe", lastSeen: new Date() }
          : member
      )
    );
  };

  // model progress start
  const handleStartModule = (moduleId: string) => {
    // Update module progress
    setSafetyModules((modules) =>
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              isLocked: false,
              progress: Math.min(module.progress + 25, 100),
            }
          : module
      )
    );

    // For now, just log or alert
    console.log("Would navigate to module page:", moduleId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-100 text-green-800";
      case "in_danger":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const completedModules = safetyModules.filter(
    (m) => m.progress === 100
  ).length;
  const safeFamilyMembers = familyMembers.filter(
    (m) => m.status === "safe"
  ).length;

  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <Alert className="max-w-md">
  //         <AlertTriangle className="h-4 w-4" />
  //         <AlertDescription>
  //           Please login to access your dashboard.
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("dashboard.welcome")}, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your family safety and learning progress
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Family Safe
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {safeFamilyMembers}/{familyMembers.length}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Modules Completed
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {completedModules}/{safetyModules.length}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Emergency Kit
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {emergencyKitStatus}%
                  </p>
                </div>
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Badges Earned
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {completedModules}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="family" className="space-y-6">
          <TabsList className="flex flex-wrap w-full justify-center gap-2">
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("dashboard.familyMembers")}
            </TabsTrigger>

            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t("dashboard.safetyModules")}
            </TabsTrigger>

            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t("dashboard.recentAlerts")}
            </TabsTrigger>
          </TabsList>

          {/* Family Locator Tab */}
          <TabsContent value="family" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      {t("family.title")}
                    </CardTitle>
                    <CardDescription>
                      Track your family members' safety status
                    </CardDescription>
                  </div>

                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {t("family.addMember")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("family.addMember")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="member-name">
                            {t("family.memberName")}
                          </Label>
                          <Input
                            id="member-name"
                            value={newMember.name}
                            onChange={(e) =>
                              setNewMember((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter family member name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="member-phone">
                            {t("family.memberPhone")}
                          </Label>
                          <Input
                            id="member-phone"
                            value={newMember.phone}
                            onChange={(e) =>
                              setNewMember((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          Unique ID will be generated automatically
                        </div>

                        <Button
                          onClick={handleAddFamilyMember}
                          className="w-full"
                        >
                          Add Member
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-600">
                            {member.phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {member.uniqueId}
                          </p>

                          {member.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {member.location.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status === "safe" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : member.status === "in_danger" ? (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {t(`family.${member.status}`)}
                        </Badge>

                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendSafetyCheck(member.id)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {t("family.areYouOk")}
                          </Button>

                          {member.status !== "safe" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkSafe(member.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t("family.markDone")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Modules Tab */}
          <TabsContent value="safety" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  {t("safety.title")}
                </CardTitle>
                <CardDescription>
                  Complete safety training modules to earn badges
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safetyModules.map((module) => (
                    <Card
                      key={module.id}
                      className={module.isLocked ? "opacity-75" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{module.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium flex items-center gap-2">
                              {module.title}
                              {module.isLocked && (
                                <Lock className="w-4 h-4 text-gray-500" />
                              )}
                              {module.badge && (
                                <Badge variant="secondary">
                                  {module.badge}
                                </Badge>
                              )}
                            </h3>

                            <p className="text-sm text-gray-600 mt-1">
                              {module.description}
                            </p>

                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{module.category}</span>•
                              <span>{module.duration}</span>
                            </div>

                            {module.progress > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{t("safety.progress")}</span>
                                  <span>{module.progress}%</span>
                                </div>
                                <Progress
                                  value={module.progress}
                                  className="h-2"
                                />
                              </div>
                            )}

                            <div className="mt-3">
                              {/* {module.isLocked ? (
                                <Button size="sm" disabled className="w-full">
                                  <Lock className="w-3 h-3 mr-1" />
                                  {t("safety.locked")}
                                </Button>
                              ) : module.progress === 100 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t("safety.completed")}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartModule(module.id)}
                                  className="w-full"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {module.progress > 0
                                    ? t("safety.continue")
                                    : t("safety.start")}
                                </Button>
                              )} */}
                              <Button
                                size="sm"
                                onClick={() => handleStartModule(module.id)}
                                className="w-full"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                {module.progress > 0
                                  ? t("safety.continue")
                                  : t("safety.start")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {t("dashboard.recentAlerts")}
                </CardTitle>
                <CardDescription>
                  Recent earthquake alerts and safety notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Your alert components remain as-is */}
                ...
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
