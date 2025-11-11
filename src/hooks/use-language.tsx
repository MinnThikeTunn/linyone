'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'my'

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const translations = {
  en: {
    // Navigation
    'nav.map': 'Map',
    'nav.safety': 'Safety',
    'nav.volunteers': 'Volunteers',
    'nav.organizations': 'Organizations',
    'nav.dashboard': 'Dashboard',
    'nav.recentAlerts': 'Recent Alerts',
    'nav.family': 'Family Locator',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.aiChat': 'AI Chat',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Map
    'map.title': 'Earthquake Response Map',
    'map.subtitle': 'Real-time alerts and safe zones',
    'map.currentLocation': 'Current Location',
    'map.addPin': 'Add Pin',
    'map.damagedLocation': 'Damaged Location',
    'map.safeZone': 'Safe Zone/Shelter',
    'map.pending': 'Pending',
    'map.confirmed': 'Confirmed',
    'map.completed': 'Completed',
    'map.description': 'Description',
    'map.uploadImage': 'Upload Image',
    'map.submit': 'Submit',
    'map.cancel': 'Cancel',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.phone': 'Phone',
    'auth.role': 'Role',
    'auth.user': 'User',
    'auth.trackingVolunteer': 'Tracking Volunteer',
    'auth.supplyVolunteer': 'Supply Support Volunteer',
    'auth.organization': 'Organization',
    'auth.admin': 'Admin',
    'auth.selectOrganization': 'Select Organization',
    'auth.createAccount': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.emergencyKit': 'Emergency Kit Status',
    'dashboard.familyMembers': 'Family Members',
    'dashboard.safetyModules': 'Safety Learning Modules',
    'dashboard.recentAlerts': 'Recent Alerts',
    'dashboard.quickActions': 'Quick Actions',
    
    // Family Locator
    'family.title': 'Family Locator',
    'family.addMember': 'Add Family Member',
    'family.memberName': 'Member Name',
    'family.memberPhone': 'Member Phone',
    'family.uniqueId': 'Unique ID',
    'family.imSafe': 'I\'m Safe',
    'family.areYouOk': 'Are You OK?',
    'family.markDone': 'Mark Done',
    'family.lastSeen': 'Last Seen',
    'family.status': 'Status',
    
    // Safety Modules
    'safety.title': 'Safety Learning Modules',
    'safety.cpr': 'CPR Training',
    'safety.firstAid': 'First Aid',
    'safety.earthquake': 'Earthquake Safety',
    'safety.emergency': 'Emergency Preparedness',
    'safety.locked': 'Locked - Register to unlock',
    'safety.progress': 'Progress',
    'safety.start': 'Start',
    'safety.continue': 'Continue',
    'safety.completed': 'Completed',
    
    // Volunteer
    'volunteer.title': 'Volunteer Dashboard',
    'volunteer.pendingPins': 'Pending Pins',
    'volunteer.confirm': 'Confirm',
    'volunteer.deny': 'Deny',
    'volunteer.assignments': 'Assignments',
    'volunteer.supplyRoutes': 'Supply Routes',
    'volunteer.markDelivered': 'Mark Delivered',
    'volunteer.onTheWay': 'On the way',
    
    // Organization
    'org.title': 'Organization Dashboard',
    'org.volunteerManagement': 'Volunteer Management',
    'org.helpRequests': 'Help Requests',
    'org.approve': 'Approve',
    'org.reject': 'Reject',
    'org.assign': 'Assign',
    'org.collaboration': 'Collaboration Mode',
    
    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.registerOrg': 'Register Organization',
    'admin.orgName': 'Organization Name',
    'admin.orgUsername': 'Username',
    'admin.orgPassword': 'Password',
    'admin.orgRegion': 'Region',
    'admin.orgFunding': 'Funding',
    'admin.manageOrgs': 'Manage Organizations',
    'admin.edit': 'Edit',
    'admin.delete': 'Delete',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.refresh': 'Refresh',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Emergency
    'emergency.alert': 'Emergency Alert',
    'emergency.shelter': 'Nearest Shelter',
    'emergency.evacuate': 'Evacuate Now',
    'emergency.supplies': 'Emergency Supplies',
    'emergency.contact': 'Emergency Contact',
    'emergency.instructions': 'Safety Instructions',
  },
  my: {
    // Navigation
    'nav.map': 'မြေပုံ',
    'nav.safety': 'လုံခြုံရေး',
    'nav.volunteers': 'စေတနာ့ဝန်ထမ်းများ',
    'nav.organizations': 'အဖွဲ့အစည်းများ',
    'nav.dashboard': 'ဒက်ရှ်ဘုတ်',
    'nav.family': '�မိသားစုရှာဖွေရေး',
    'nav.profile': 'ကိုယ်ရေးအချက်အလက်',
    'nav.admin': 'စီမံခန့်ခွဲသူ',
    'nav.aiChat': 'AI စကားပြော',
    'nav.login': 'ဝင်ရောက်ရန်',
    'nav.register': 'စာရင်းသွင်းရန်',
    'nav.logout': 'ထွက်ရန်',
    
    // Map
    'map.title': 'ငလျင်တုန်လှုပ်မှုအသုံးချမြေပုံ',
    'map.subtitle': 'အချိန်နှင့်တပြေးညီသတိပေးချက်များနှင့် လုံခြုံရေးဇုန်များ',
    'map.currentLocation': 'လက်ရှိတည်နေရာ',
    'map.addPin': 'ပင်ထည့်ရန်',
    'map.damagedLocation': 'ပျက်စီးသောတည်နေရာ',
    'map.safeZone': 'လုံခြုံရေးဇုန်/ခိုလှုံရာ',
    'map.pending': 'စောင့်ဆိုင်းဆဲ',
    'map.confirmed': 'အတည်ပြုပြီး',
    'map.completed': 'ပြီးမြောက်ပြီး',
    'map.description': 'ဖော်ပြချက်',
    'map.uploadImage': 'ပုံတင်ရန်',
    'map.submit': 'တင်ရန်',
    'map.cancel': 'ပယ်ဖျက်ရန်',
    
    // Auth
    'auth.login': 'ဝင်ရောက်ရန်',
    'auth.register': 'စာရင်းသွင်းရန်',
    'auth.email': 'အီးမေးလ်',
    'auth.password': 'စကားဝှက်',
    'auth.name': 'အမည်',
    'auth.phone': 'ဖုန်း',
    'auth.role': 'အခန်းကဏ္ဍ',
    'auth.user': 'အသုံးပြုသူ',
    'auth.trackingVolunteer': 'အစီရင်ခံစေတနာ့ဝန်ထမ်း',
    'auth.supplyVolunteer': 'ထောက်ပံ့စေတနာ့ဝန်ထမ်း',
    'auth.organization': 'အဖွဲ့အစည်း',
    'auth.admin': 'စီမံခန့်ခွဲသူ',
    'auth.selectOrganization': 'အဖွဲ့အစည်းရွေးချယ်ရန်',
    'auth.createAccount': 'အကောင့်ဖန်တီးရန်',
    'auth.alreadyHaveAccount': 'အကောင့်ရှိပြီးသားလား?',
    'auth.dontHaveAccount': 'အကောင့်မရှိဘူးလား?',
    
    // Dashboard
    'dashboard.welcome': 'ပြန်လည်ကြိုဆိုပါသည်',
    'dashboard.emergencyKit': 'အရေးပေါ်အသုံးအဆောင်အခြေအနေ',
    'dashboard.familyMembers': 'မိသားစုဝင်များ',
    'dashboard.safetyModules': 'လုံခြုံရေးသင်တန်းမော်ဂျူးများ',
    'dashboard.recentAlerts': 'နောက်ဆုံးသတိပေးချက်များ',
    'dashboard.quickActions': 'လျင်မြန်သောလုပ်ငန်းများ',
    
    // Family Locator
    'family.title': 'မိသားစုရှာဖွေရေး',
    'family.addMember': 'မိသားစုဝင်ထည့်ရန်',
    'family.memberName': 'ဝင်အမည်',
    'family.memberPhone': 'ဝင်ဖုန်း',
    'family.uniqueId': 'တစ်ဦးတည်းအိုင်ဒီ',
    'family.imSafe': 'ကျွန်ုပ်ဘေးကင်းပါသည်',
    'family.areYouOk': 'နေကောင်းလား?',
    'family.markDone': 'ပြီးမြောက်ပါသည်ဟုမှတ်ယူရန်',
    'family.lastSeen': 'နောက်ဆုံးမြင်ရသော',
    'family.status': 'အခြေအနေ',
    
    // Safety Modules
    'safety.title': 'လုံခြုံရေးသင်တန်းမော်ဂျူးများ',
    'safety.cpr': 'CPR သင်တန်း',
    'safety.firstAid': 'ပထမအကူအညီ',
    'safety.earthquake': 'ငလျင်လုံခြုံရေး',
    'safety.emergency': 'အရေးပေါ်ပြင်ဆင်မှု',
    'safety.locked': '�ပိတ်ထားသည် - ဖွင့်ရန်စာရင်းသွင်းပါ',
    'safety.progress': 'တိုးတက်မှု',
    'safety.start': 'စတင်ရန်',
    'safety.continue': 'ဆက်လက်ရန်',
    'safety.completed': 'ပြီးမြောက်ပြီး',
    
    // Volunteer
    'volunteer.title': 'စေတနာ့ဝန်ထမ်းဒက်ရှ်ဘုတ်',
    'volunteer.pendingPins': 'စောင့်ဆိုင်းဆဲပင်များ',
    'volunteer.confirm': 'အတည်ပြုရန်',
    'volunteer.deny': 'ငြင်းပယ်ရန်',
    'volunteer.assignments': 'တာဝန်များ',
    'volunteer.supplyRoutes': 'ထောက်ပံ့လမ်းကြောင်းများ',
    'volunteer.markDelivered': 'ပို့ဆောင်ပြီးဟုမှတ်ယူရန်',
    'volunteer.onTheWay': 'လာနေသည်',
    
    // Organization
    'org.title': 'အဖွဲ့အစည်းဒက်ရှ်ဘုတ်',
    'org.volunteerManagement': 'စေတနာ့ဝန်ထမ်းစီမံခန့်ခွဲမှု',
    'org.helpRequests': 'အကူအညီတောင်းဆိုမှုများ',
    'org.approve': 'အတည်ပြုရန်',
    'org.reject': 'ငြင်းပယ်ရန်',
    'org.assign': 'တာဝန်ပေးရန်',
    'org.collaboration': 'ပူးပေါင်းဆောင်ရွက်မှုစနစ်',
    
    // Admin
    'admin.title': 'စီမံခန့်ခွဲသူဒက်ရှ်ဘုတ်',
    'admin.registerOrg': 'အဖွဲ့အစည်းစာရင်းသွင်းရန်',
    'admin.orgName': 'အဖွဲ့အစည်းအမည်',
    'admin.orgUsername': 'အသုံးပြုသူအမည်',
    'admin.orgPassword': 'စကားဝှက်',
    'admin.orgRegion': 'ဒေသ',
    'admin.orgFunding': 'ငွေကြေးထောက်ပံ့မှု',
    'admin.manageOrgs': 'အဖွဲ့အစည်းများစီမံခန့်ခွဲရန်',
    'admin.edit': 'တည်းဖြတ်ရန်',
    'admin.delete': 'ဖျက်ရန်',
    
    // Common
    'common.loading': 'တင်နေသည်...',
    'common.error': 'အမှား',
    'common.success': 'အောင်မြင်သည်',
    'common.save': 'သိမ်းဆည်းရန်',
    'common.cancel': 'ပယ်ဖျက်ရန်',
    'common.delete': 'ဖျက်ရန်',
    'common.edit': 'တည်းဖြတ်ရန်',
    'common.view': 'ကြည့်ရှုရန်',
    'common.search': 'ရှာဖွေရန်',
    'common.filter': 'စိစစ်ရန်',
    'common.refresh': 'ပြန်လည်ဆန်းသစ်ရန်',
    'common.close': 'ပိတ်ရန်',
    'common.yes': 'ဟုတ်ကဲ့',
    'common.no': 'မဟုတ်ပါ',
    'common.ok': 'ကောင်းပြီး',
    'common.submit': 'တင်ရန်',
    'common.back': 'နောက်သို့',
    'common.next': 'ရှေ့သို့',
    'common.previous': 'ယခင်',
    
    // Emergency
    'emergency.alert': 'အရေးပေါ်သတိပေးချက်',
    'emergency.shelter': 'အနီးဆုံးခိုလှုံရာ',
    'emergency.evacuate': 'ယခုပင်ရွှေ့ပြောင်းပါ',
    'emergency.supplies': 'အရေးပေါ်ပစ္စည်းများ',
    'emergency.contact': 'အရေးပေါ်ဆက်သွယ်ရန်',
    'emergency.instructions': 'လုံခြုံရေးညွှန်ကြားချက်များ',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['en', 'my'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}