"use client";


import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'
import FamilyTab from '@/components/family-tab'
import { fetchFamilyMembers } from '@/services/family'
import { supabase } from '@/lib/supabase'

import { mockSafetyModules } from "@/data/mockSafetyModules";
import Link from "next/link";
import { LiveAlerts } from "@/components/alerts/live-alerts";

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
  badge?: string;
  icon: React.ReactNode;
}

// Family members will be loaded from the backend; start with empty list

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [safetyModules, setSafetyModules] =
    useState<SafetyModule[]>(mockSafetyModules);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFound, setSelectedFound] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const [memberRelation, setMemberRelation] = useState('');
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    uniqueId: "",
  });
  const [emergencyKitStatus, setEmergencyKitStatus] = useState(75);

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

  const handleSendSafetyCheck = (memberId: string) => {
    // In a real app, this would send a notification
    alert(
      "Safety check sent to " +
        familyMembers.find((m) => m.id === memberId)?.name
    );
  };

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

  // const completedModules = safetyModules.filter(
  //   (m) => m.progress === 100
  // ).length;

  // Load family members for current user and subscribe to changes
  useEffect(() => {
    let channel: any;
    const load = async () => {
      if (!user?.id) return;
      try {
        const links = await fetchFamilyMembers(user.id);
        const mapped = (links || []).map((l: any) => ({
          id: l.member?.id ?? l.id,
          name: l.member?.name ?? "Unknown",
          phone: l.member?.phone ?? "",
          uniqueId: l.member?.id ?? l.id,
          status: l.safety_status ?? null,
          safety_check_started_at: l.safety_check_started_at,
          safety_check_expires_at: l.safety_check_expires_at,
          lastSeen: new Date(),
        }));
        const seen = new Set<string>();
        const deduped = mapped.filter((m: any) => {
          const key = m.id;
          if (!key) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFamilyMembers(deduped);
      } catch (e) {
        console.warn("failed to load family members", e);
      }
      try {
        channel = supabase
          .channel(`family_members:${user.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'family_members', filter: `user_id=eq.${user.id}` }, async () => {
            const links = await fetchFamilyMembers(user.id)
            const mapped = (links || []).map((l: any) => ({
              id: l.member?.id ?? l.id,
              name: l.member?.name ?? 'Unknown',
              phone: l.member?.phone ?? '',
              uniqueId: l.member?.id ?? l.id,
              status: l.safety_status ?? null,
              safety_check_started_at: l.safety_check_started_at,
              safety_check_expires_at: l.safety_check_expires_at,
              lastSeen: new Date()
            }))
            const seen2 = new Set<string>()
            const deduped2 = mapped.filter((m: any) => {
              const key = m.id
              if (!key) return false
              if (seen2.has(key)) return false
              seen2.add(key)
              return true
            })
            setFamilyMembers(deduped2)
          })
          // Intentionally skip UPDATE subscription for safety status so UI changes only when the
          // corresponding notification arrives (keeps status + notification in sync timing)
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'family_members', filter: `user_id=eq.${user.id}` }, async () => {
            const links = await fetchFamilyMembers(user.id)
            const mapped = (links || []).map((l: any) => ({
              id: l.member?.id ?? l.id,
              name: l.member?.name ?? 'Unknown',
              phone: l.member?.phone ?? '',
              uniqueId: l.member?.id ?? l.id,
              status: l.safety_status ?? null,
              safety_check_started_at: l.safety_check_started_at,
              safety_check_expires_at: l.safety_check_expires_at,
              lastSeen: new Date()
            }))
            setFamilyMembers(mapped)
          })
          .subscribe()
      } catch (e) {
        console.warn('failed to subscribe family_members', e)
      }
    }
    load()
    return () => {
      try { (channel as any)?.unsubscribe?.() } catch {}
    }
  }, [user?.id])

  const safeFamilyMembers = familyMembers.filter((m) => m.status === "safe").length;

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
    <div className="min-h-screen bg-gray-50">
  <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
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
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 md:mb-8">
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
                  {/* <p className="text-2xl font-bold text-blue-600">
                    {completedModules}/{safetyModules.length}
                  </p> */}
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
                  {/* <p className="text-2xl font-bold text-purple-600">
                    {completedModules}
                  </p> */}
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
          <FamilyTab
            t={t}
            user={user}
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            showAddMember={showAddMember}
            setShowAddMember={setShowAddMember}
            searchIdentifier={searchIdentifier}
            setSearchIdentifier={setSearchIdentifier}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            selectedFound={selectedFound}
            setSelectedFound={setSelectedFound}
            searching={searching}
            setSearching={setSearching}
            searchTimeout={searchTimeout}
            setSearchTimeout={setSearchTimeout}
            memberRelation={memberRelation}
            setMemberRelation={setMemberRelation}
          />

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
                    <Card key={module.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{module.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium flex items-center gap-2">
                              {module.title}
                              {/* {module.isLocked && (
                                <Lock className="w-4 h-4 text-gray-500" />
                              )} */}
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
                              <span>{module.category}</span>
                            </div>

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
                                <Link
                                  key={module.id}
                                  href={`/safetycourse/${module.id}`}
                                  // size="sm"
                                  onClick={() => handleStartModule(module.id)}
                                  className="w-full"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {module.progress > 0
                                    ? t("safety.continue")
                                    : t("safety.start")}
                                </Link>
                              )} */}
                              <Link
                                key={module.id}
                                href={`/safetycourse/${module.id}`}
                                // size="sm"
                                // onClick={() => handleStartModule(module.id)}
                                className="flex items-center justify-center w-full bg-black rounded-lg text-white py-2"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                {/* {module.progress > 0
                                  ? t("safety.continue")
                                  : t("safety.start")} */}
                                {t("safety.start")}
                              </Link>
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
          <TabsContent value="alerts" className="space-y-6 pb-8">
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
                <LiveAlerts />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
