"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "my";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

const translations = {
  en: {
    // Navigation
    "nav.map": "Map",
    "nav.safety": "Safety",
    "nav.volunteers": "Volunteers",
    "nav.organizations": "Organizations",
    "nav.dashboard": "Dashboard",
    "nav.recentAlerts": "Recent Alerts",
    "nav.family": "Family Locator",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "nav.aiChat": "AI Chat",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",

    // Map
    "map.title": "Incident Information",
    "map.subtitle": "Real-time alerts and safe zones",
    "map.currentLocation": "Your Location",
    "map.addPin": "Add Pin",
    "map.damagedLocation": "Damaged Location",
    "map.safeZone": "Safe Zone/Shelter",
    "map.pending": "Pending",
    "map.confirmed": "Confirmed",
    "map.completed": "Completed",
    "map.description": "Description",
    "map.uploadImage": "Upload Image",
    "map.submit": "Submit",
    "map.cancel": "Cancel",

    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.phone": "Phone",
    "auth.role": "Role",
    "auth.user": "User",
    "auth.trackingVolunteer": "Tracking Volunteer",
    "auth.supplyVolunteer": "Supply Support Volunteer",
    "auth.organization": "Organization",
    "auth.admin": "Admin",
    "auth.selectOrganization": "Select Organization",
    "auth.createAccount": "Create Account",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.dontHaveAccount": "Don't have an account?",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.emergencyKit": "Emergency Kit Status",
    "dashboard.familyMembers": "Family Members",
    "dashboard.safetyModules": "Safety Learning Modules",
    "dashboard.recentAlerts": "Recent Alerts",
    "dashboard.quickActions": "Quick Actions",

    // Family Locator
    "family.title": "Family Locator",
    "family.addMember": "Add Family Member",
    "family.memberName": "Member Name",
    "family.memberPhone": "Member Phone",
    "family.uniqueId": "Unique ID",
    "family.imSafe": "I'm Safe",
    "family.areYouOk": "Are You OK?",
  // "family.markDone": "Mark Done", // removed feature
    "family.lastSeen": "Last Seen",
    "family.status": "Status",

    // Safety Modules
    "safety.title": "Safety Learning Modules",
    "safety.cpr": "CPR Training",
    "safety.firstAid": "First Aid",
    "safety.earthquake": "Earthquake Safety",
    "safety.emergency": "Emergency Preparedness",
    "safety.locked": "Locked - Register to unlock",
    "safety.progress": "Progress",
    "safety.start": "Start",
    "safety.continue": "Continue",
    "safety.completed": "Completed",

    // Volunteer
    "volunteer.title": "Volunteer Dashboard",
    "volunteer.pendingPins": "Pending Pins",
    "volunteer.confirm": "Confirm",
    "volunteer.deny": "Deny",
    "volunteer.assignments": "Assignments",
    "volunteer.supplyRoutes": "Supply Routes",
    "volunteer.markDelivered": "Mark Delivered",
    "volunteer.onTheWay": "On the way",

    // Organization
    "org.title": "Organization Dashboard",
    "org.volunteerManagement": "Volunteer Management",
    "org.helpRequests": "Help Requests",
    "org.approve": "Approve",
    "org.reject": "Reject",
    "org.assign": "Assign",
    "org.collaboration": "Collaboration Mode",

    // Admin
    "admin.title": "Admin Dashboard",
    "admin.registerOrg": "Register Organization",
    "admin.orgName": "Organization Name",
    "admin.orgUsername": "Username",
    "admin.orgPassword": "Password",
    "admin.orgRegion": "Region",
    "admin.orgFunding": "Funding",
    "admin.manageOrgs": "Manage Organizations",
    "admin.edit": "Edit",
    "admin.delete": "Delete",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.refresh": "Refresh",
    "common.close": "Close",
    "common.yes": "Yes",
    "common.no": "No",
    "common.ok": "OK",
    "common.submit": "Submit",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",

    // Emergency
    "emergency.alert": "Emergency Alert",
    "emergency.shelter": "Nearest Shelter",
    "emergency.evacuate": "Evacuate Now",
    "emergency.supplies": "Emergency Supplies",
    "emergency.contact": "Emergency Contact",
    "emergency.instructions": "Safety Instructions",

    // Family Tab Alerts
    "family.checkSent": "Safety check sent",
    "family.checkFailed": "Failed to send safety check",
    "family.cancelFailed": "Failed to cancel request",
    "family.specifyRelation": "Please specify the relation before sending request",
    "family.requestSent": "Family request sent! Waiting for approval.",
    "family.alreadyInNetwork": "This member is already in your family network.",
    "family.alreadyRequested": "You have already sent a request to this person.",
    "family.sendRequestFailed": "Failed to send request. Please try again.",
    "family.errorOccurred": "An error occurred. Please try again.",
    "family.unlinkFailed": "Failed to unlink member",

    // Safety Module
    "safety.moduleLocked": "This module is locked. Please complete the prerequisites first.",

    // Admin Alerts
    "admin.fillRequired": "Please fill all required fields",
    "admin.createError": "Error creating organization",
    "admin.createSuccess": "Organization registered successfully!",
    "admin.updateError": "Error updating organization",
    "admin.updateSuccess": "Organization updated successfully!",

    // Registration Form
    "register.user": "User",
    "register.organization": "Organization",
    "register.orgName": "Organization Name",
    "register.orgPhone": "Organization Phone",
    "register.orgAddress": "Organization Address",
    "register.enterFullName": "Enter your full name",
    "register.enterEmail": "Enter your email",
    "register.enterPhone": "Enter your phone number",
    "register.enterOrgPhone": "Enter organization contact number",
    "register.enterOrgAddress": "Enter organization address",
    "register.enterPassword": "Enter password",
    "register.confirmPassword": "Confirm password",
    "register.agreeTerms": "I agree to the terms and conditions and privacy policy",

    // Map Page
    "map.done": "Done",
    "map.selectLocation": "Select Location",
    "map.changeLocation": "Change Location",
    "map.legend": "Legend",
    "map.recentReports": "Recent Reports",
    "map.quickStats": "Quick Stats",
    "map.damagedAreas": "Damaged Areas",
    "map.safeZones": "Safe Zones",
    "map.title_label": "Title",
    "map.loading": "Loading map...",
    "map.reloadPage": "Reload Page",
    "map.noCoordinates": "No coordinates available.",

    // Organization Page
    "org.analytics": "Analytics",
    "org.refresh": "Refresh",
    "org.noOrganizations": "No organizations found.",
    "org.activeOrganizations": "Active Organizations",
    "org.pendingApproval": "Pending Approval",
    "org.totalVolunteers": "Total Volunteers",
    "org.supplies": "Supplies",
    "org.medical": "Med",
    "org.food": "Food",
    "org.water": "Water",
    "org.shelter": "Shelter",
    "org.equipment": "Equip",
    "org.noSupplies": "N/A",
    "org.tableHeaders": "Organization,Region,Volunteers,Funding,Supplies,Status,Actions",
    "org.editOrganization": "Edit Organization",
    "org.manageOrgs": "Manage organizations and monitor platform activity",

    // Volunteers Page
    "volunteer.viewConnect": "View and connect with volunteers across the earthquake response network",
    "volunteer.totalActive": "Total",
    "volunteer.activeVolunteers": "Active",
    "volunteer.onMission": "On Mission",
    "volunteer.totalMissions": "Total Missions",
    "volunteer.avgRating": "Avg Rating",
    "volunteer.searchPlaceholder": "Search volunteers...",
    "volunteer.listView": "List View",
    "volunteer.trackingVolunteers": "Tracking Volunteers",
    "volunteer.supplyVolunteers": "Supply Volunteers",
    "volunteer.allRoles": "All Roles",
    "volunteer.allStatus": "All Status",
    "volunteer.active": "Active",
    "volunteer.tableHeaders": "Volunteer,Role,Location,Status,Missions,Hours,Rating,Status",
    "volunteer.comprehensiveView": "Comprehensive view of all volunteers in the network",

    // Family Tab
    "family.sendRequest": "Send Request",
    "family.relation": "Relation",
    "family.mother": "Mother",
    "family.father": "Father",
    "family.brother": "Brother",
    "family.sister": "Sister",
    "family.wife": "Wife",
    "family.husband": "Husband",
    "family.son": "Son",
    "family.daughter": "Daughter",
    "family.pending": "Pending",
    "family.relationLabel": "Relation:",
    "family.lastSeenLabel": "Last seen:",
    "family.viewMap": "View on Map",

    // Admin Page Additional
    "admin.orgName_label": "Organization Name",
    "admin.orgEmail_label": "Email",
    "admin.orgPhone_label": "Phone",
    "admin.orgAddress_label": "Address",
    "admin.orgPassword_label": "Password",
    "admin.orgRegion_label": "Region",
    "admin.orgFunding_label": "Funding",
  },
  my: {
    // Navigation
    "nav.map": "မြေပုံ",
    "nav.safety": "လုံခြုံရေး",
    "nav.volunteers": "စေတနာ့ဝန်ထမ်းများ",
    "nav.organizations": "အဖွဲ့အစည်းများ",
    "nav.dashboard": "ဒက်ရှ်ဘုတ်",
    "nav.family": "�မိသားစုရှာဖွေရေး",
    "nav.profile": "ကိုယ်ရေးအချက်အလက်",
    "nav.admin": "စီမံခန့်ခွဲသူ",
    "nav.aiChat": "AI စကားပြော",
    "nav.login": "ဝင်ရောက်ရန်",
    "nav.register": "စာရင်းသွင်းရန်",
    "nav.logout": "ထွက်ရန်",

    // Map
    "map.title": "ငလျင်တုန်လှုပ်မှုအသုံးချမြေပုံ",
    "map.subtitle": "အချိန်နှင့်တပြေးညီသတိပေးချက်များနှင့် လုံခြုံရေးဇုန်များ",
    "map.currentLocation": "လက်ရှိတည်နေရာ",
    "map.addPin": "ပင်ထည့်ရန်",
    "map.damagedLocation": "ပျက်စီးသောတည်နေရာ",
    "map.safeZone": "လုံခြုံရေးဇုန်/ခိုလှုံရာ",
    "map.pending": "စောင့်ဆိုင်းဆဲ",
    "map.confirmed": "အတည်ပြုပြီး",
    "map.completed": "ပြီးမြောက်ပြီး",
    "map.description": "ဖော်ပြချက်",
    "map.uploadImage": "ပုံတင်ရန်",
    "map.submit": "တင်ရန်",
    "map.cancel": "ပယ်ဖျက်ရန်",

    // Auth
    "auth.login": "ဝင်ရောက်ရန်",
    "auth.register": "စာရင်းသွင်းရန်",
    "auth.email": "အီးမေးလ်",
    "auth.password": "စကားဝှက်",
    "auth.name": "အမည်",
    "auth.phone": "ဖုန်း",
    "auth.role": "အခန်းကဏ္ဍ",
    "auth.user": "အသုံးပြုသူ",
    "auth.trackingVolunteer": "အစီရင်ခံစေတနာ့ဝန်ထမ်း",
    "auth.supplyVolunteer": "ထောက်ပံ့စေတနာ့ဝန်ထမ်း",
    "auth.organization": "အဖွဲ့အစည်း",
    "auth.admin": "စီမံခန့်ခွဲသူ",
    "auth.selectOrganization": "အဖွဲ့အစည်းရွေးချယ်ရန်",
    "auth.createAccount": "အကောင့်ဖန်တီးရန်",
    "auth.alreadyHaveAccount": "အကောင့်ရှိပြီးသားလား?",
    "auth.dontHaveAccount": "အကောင့်မရှိဘူးလား?",

    // Dashboard
    "dashboard.welcome": "ပြန်လည်ကြိုဆိုပါသည်",
    "dashboard.emergencyKit": "အရေးပေါ်အသုံးအဆောင်အခြေအနေ",
    "dashboard.familyMembers": "မိသားစုဝင်များ",
    "dashboard.safetyModules": "လုံခြုံရေးသင်တန်းမော်ဂျူးများ",
    "dashboard.recentAlerts": "နောက်ဆုံးသတိပေးချက်များ",
    "dashboard.quickActions": "လျင်မြန်သောလုပ်ငန်းများ",

    // Family Locator
    "family.title": "မိသားစုရှာဖွေရေး",
    "family.addMember": "မိသားစုဝင်ထည့်ရန်",
    "family.memberName": "ဝင်အမည်",
    "family.memberPhone": "ဝင်ဖုန်း",
    "family.uniqueId": "တစ်ဦးတည်းအိုင်ဒီ",
    "family.imSafe": "ကျွန်ုပ်ဘေးကင်းပါသည်",
    "family.areYouOk": "နေကောင်းလား?",
  // "family.markDone": "ပြီးမြောက်ပါသည်ဟုမှတ်ယူရန်", // removed feature
    "family.lastSeen": "နောက်ဆုံးမြင်ရသော",
    "family.status": "အခြေအနေ",

    // Safety Modules
    "safety.title": "လုံခြုံရေးသင်တန်းမော်ဂျူးများ",
    "safety.cpr": "CPR သင်တန်း",
    "safety.firstAid": "ပထမအကူအညီ",
    "safety.earthquake": "ငလျင်လုံခြုံရေး",
    "safety.emergency": "အရေးပေါ်ပြင်ဆင်မှု",
    "safety.locked": "�ပိတ်ထားသည် - ဖွင့်ရန်စာရင်းသွင်းပါ",
    "safety.progress": "တိုးတက်မှု",
    "safety.start": "စတင်ရန်",
    "safety.continue": "ဆက်လက်ရန်",
    "safety.completed": "ပြီးမြောက်ပြီး",

    // Volunteer
    "volunteer.title": "စေတနာ့ဝန်ထမ်းဒက်ရှ်ဘုတ်",
    "volunteer.pendingPins": "စောင့်ဆိုင်းဆဲပင်များ",
    "volunteer.confirm": "အတည်ပြုရန်",
    "volunteer.deny": "ငြင်းပယ်ရန်",
    "volunteer.assignments": "တာဝန်များ",
    "volunteer.supplyRoutes": "ထောက်ပံ့လမ်းကြောင်းများ",
    "volunteer.markDelivered": "ပို့ဆောင်ပြီးဟုမှတ်ယူရန်",
    "volunteer.onTheWay": "လာနေသည်",

    // Organization
    "org.title": "အဖွဲ့အစည်းဒက်ရှ်ဘုတ်",
    "org.volunteerManagement": "စေတနာ့ဝန်ထမ်းစီမံခန့်ခွဲမှု",
    "org.helpRequests": "အကူအညီတောင်းဆိုမှုများ",
    "org.approve": "အတည်ပြုရန်",
    "org.reject": "ငြင်းပယ်ရန်",
    "org.assign": "တာဝန်ပေးရန်",
    "org.collaboration": "ပူးပေါင်းဆောင်ရွက်မှုစနစ်",

    // Admin
    "admin.title": "စီမံခန့်ခွဲသူဒက်ရှ်ဘုတ်",
    "admin.registerOrg": "အဖွဲ့အစည်းစာရင်းသွင်းရန်",
    "admin.orgName": "အဖွဲ့အစည်းအမည်",
    "admin.orgUsername": "အသုံးပြုသူအမည်",
    "admin.orgPassword": "စကားဝှက်",
    "admin.orgRegion": "ဒေသ",
    "admin.orgFunding": "ငွေကြေးထောက်ပံ့မှု",
    "admin.manageOrgs": "အဖွဲ့အစည်းများစီမံခန့်ခွဲရန်",
    "admin.edit": "တည်းဖြတ်ရန်",
    "admin.delete": "ဖျက်ရန်",

    // Common
    "common.loading": "တင်နေသည်...",
    "common.error": "အမှား",
    "common.success": "အောင်မြင်သည်",
    "common.save": "သိမ်းဆည်းရန်",
    "common.cancel": "ပယ်ဖျက်ရန်",
    "common.delete": "ဖျက်ရန်",
    "common.edit": "တည်းဖြတ်ရန်",
    "common.view": "ကြည့်ရှုရန်",
    "common.search": "ရှာဖွေရန်",
    "common.filter": "စိစစ်ရန်",
    "common.refresh": "ပြန်လည်ဆန်းသစ်ရန်",
    "common.close": "ပိတ်ရန်",
    "common.yes": "ဟုတ်ကဲ့",
    "common.no": "မဟုတ်ပါ",
    "common.ok": "ကောင်းပြီး",
    "common.submit": "တင်ရန်",
    "common.back": "နောက်သို့",
    "common.next": "ရှေ့သို့",
    "common.previous": "ယခင်",

    // Emergency
    "emergency.alert": "အရေးပေါ်သတိပေးချက်",
    "emergency.shelter": "အနီးဆုံးခိုလှုံရာ",
    "emergency.evacuate": "ယခုပင်ရွှေ့ပြောင်းပါ",
    "emergency.supplies": "အရေးပေါ်ပစ္စည်းများ",
    "emergency.contact": "အရေးပေါ်ဆက်သွယ်ရန်",
    "emergency.instructions": "လုံခြုံရေးညွှန်ကြားချက်များ",

    // Family Tab Alerts
    "family.checkSent": "လုံခြုံရေးစောင့်ဆိုင်းချက်ပို့ပြီးပါပြီ",
    "family.checkFailed": "လုံခြုံရေးစောင့်ဆိုင်းချက်ပို့ရန်မог",
    "family.cancelFailed": "တောင်းဆိုမှုပယ်ဖျက်ရန်မအောင်မြင်ခဲ့သည်",
    "family.specifyRelation": "တောင်းဆိုမှုပို့ယူမီခင်ဆက်ဆံမှုဖော်ပြပါ",
    "family.requestSent": "မိသားစုတောင်းဆိုမှုပို့ပြီးပါပြီ။ ခွင့်ပြုချက်စောင့်ဆိုင်းနေသည်။",
    "family.alreadyInNetwork": "ဤဝင်သည်ဘာယ်သာမိသားစုကွန်ယက်တွင်ပါရှိပြီးဖြစ်သည်။",
    "family.alreadyRequested": "ဤသူမှာတွင်တောင်းဆိုမှုများပြီးသားလူဖြစ်သည်။",
    "family.sendRequestFailed": "တောင်းဆိုမှုပို့ရန်မအောင်မြင်ခဲ့သည်။ ထပ်မံကြိုးစားပါ။",
    "family.errorOccurred": "အမှားအယွင်းတစ်ခုဖြစ်ပွားခဲ့သည်။ ထပ်မံကြိုးစားပါ။",
    "family.unlinkFailed": "ဝင်ဆက်သွယ်မှုဖြုတ်ခွာရန်မအောင်မြင်ခဲ့သည်",

    // Safety Module
    "safety.moduleLocked": "ဤမော်ဂျူးသည်ပိတ်ထားရှိသည်။ အခြေခံအရည်အချင်းများအဆိုပါသည်။",

    // Admin Alerts
    "admin.fillRequired": "လိုအပ်သောလယ်ဆီးများအားလုံးဖြည့်စွက်ပါ",
    "admin.createError": "အဖွဲ့အစည်းဖန်တီးမှုအမှား",
    "admin.createSuccess": "အဖွဲ့အစည်းစာရင်းသွင်းအောင်မြင်ပါပြီ!",
    "admin.updateError": "အဖွဲ့အစည်းအဆင့်မြှင့်တင်မှုအမှား",
    "admin.updateSuccess": "အဖွဲ့အစည်းအဆင့်မြှင့်တင်အောင်မြင်ပါပြီ!",

    // Registration Form
    "register.user": "အသုံးပြုသူ",
    "register.organization": "အဖွဲ့အစည်း",
    "register.orgName": "အဖွဲ့အစည်းအမည်",
    "register.orgPhone": "အဖွဲ့အစည်းဖုန်း",
    "register.orgAddress": "အဖွဲ့အစည်းလိပ်စာ",
    "register.enterFullName": "သင်၏အမည်အပြည့်အစုံထည့်သွင်းပါ",
    "register.enterEmail": "သင်၏အီးမေးလ်ထည့်သွင်းပါ",
    "register.enterPhone": "သင်၏ဖုန်းနံပါတ်ထည့်သွင်းပါ",
    "register.enterOrgPhone": "အဖွဲ့အစည်းဆက်သွယ်ရန်နံပါတ်ထည့်သွင်းပါ",
    "register.enterOrgAddress": "အဖွဲ့အစည်းလိပ်စာထည့်သွင်းပါ",
    "register.enterPassword": "စကားဝှက်ထည့်သွင်းပါ",
    "register.confirmPassword": "စကားဝှက်အတည်ပြုပါ",
    "register.agreeTerms": "ကျွန်ုပ်သည်စည်းမျဉ်းစည်းကမ်းများနှင့်နိုင်ငံရေးလုံခြုံမှုမူဝါဒကိုသဘောတူပါသည်",

    // Map Page
    "map.done": "အောင်မြင်ရန်",
    "map.selectLocation": "တည်နေရာရွေးချယ်ပါ",
    "map.changeLocation": "တည်နေရာပြောင်းလဲပါ",
    "map.legend": "ဥပဒေစည်းမျဉ်း",
    "map.recentReports": "လတ်တလောအစီရင်ခံစာများ",
    "map.quickStats": "လျင်မြန်သောစာရင်းအင်္ဂణန်များ",
    "map.damagedAreas": "ပျက်စီးသောဧရိယာများ",
    "map.safeZones": "လုံခြုံရေးဇုန်များ",
    "map.title_label": "ခေါင်းစီး",
    "map.loading": "မြေပုံတင်နေသည်...",
    "map.reloadPage": "စာမျက်နှာပြန်လည်လည်ည့ါ",
    "map.noCoordinates": "အညွှန်းအမှတ်မရှိပါ။",

    // Organization Page
    "org.analytics": "ခွဲခြမ်းစိတ်ဖြာချက်",
    "org.refresh": "ပြန်လည်ဆန်းသစ်ရန်",
    "org.noOrganizations": "အဖွဲ့အစည်းများမတွေ့ရှိပါ။",
    "org.activeOrganizations": "သက်ဆိုင်ရာအဖွဲ့အစည်းများ",
    "org.pendingApproval": "ခွင့်ပြုချက်စောင့်ဆိုင်းနေသည်",
    "org.totalVolunteers": "စုစုပေါင်းစေတနာ့ဝန်ထမ်းများ",
    "org.supplies": "ပစ္စည်းများ",
    "org.medical": "ဆေးပညာ",
    "org.food": "အစားအသုံး",
    "org.water": "ရေ",
    "org.shelter": "ခိုလှုံရာ",
    "org.equipment": "उपकरण",
    "org.noSupplies": "ဆက်သွယ်မှုမဆိုင်",
    "org.tableHeaders": "အဖွဲ့အစည်း,ဒေသ,စေတနာ့ဝန်ထမ်းများ,ငွေကြေးထောက်ပံ့မှု,ပစ္စည်းများ,အခြေအနေ,လုပ်ဆောင်ချက်များ",
    "org.editOrganization": "အဖွဲ့အစည်းတည်းဖြတ်ပါ",
    "org.manageOrgs": "အဖွဲ့အစည်းများစီမံခန့်ခွဲပြီးပလက်ဖောင်းလုပ်ဆောင်ချက်ကိုစောင့်ကြည့်ပါ",

    // Volunteers Page
    "volunteer.viewConnect": "ငလျင်အဖြေတုံ့ပြန်ကွန်ယက်တစ်ခုတွင်စေတနာ့ဝန်ထမ်းများကိုကြည့်ရှုပြီးဆက်သွယ်ပါ",
    "volunteer.totalActive": "စုစုပေါင်း",
    "volunteer.activeVolunteers": "သက်ဆိုင်ရာ",
    "volunteer.onMission": "အမှုတွေ့ဆုံခြင်း",
    "volunteer.totalMissions": "စုစုပေါင်းအမှုများ",
    "volunteer.avgRating": "ပျမ်းမျှအဆင့်သတ်မှတ်ချက်",
    "volunteer.searchPlaceholder": "စေတနာ့ဝန်ထမ်းများရှာဖွေပါ...",
    "volunteer.listView": "စာရင်းအင်္ဂணန်ကြည့်ရှုခြင်း",
    "volunteer.trackingVolunteers": "အစီရင်ခံစေတနာ့ဝန်ထမ်းများ",
    "volunteer.supplyVolunteers": "ထောက်ပံ့စေတနာ့ဝန်ထမ်းများ",
    "volunteer.allRoles": "အဖွဲ့အစည်းအခန်းကဏ္ဍများ",
    "volunteer.allStatus": "အခြေအနေများ",
    "volunteer.active": "သက်ဆိုင်ရာ",
    "volunteer.tableHeaders": "စေတနာ့ဝန်ထမ်း,အခန်းကဏ္ဍ,တည်နေရာ,အခြေအနေ,အမှုများ,နာရီများ,အဆင့်သတ်မှတ်ချက်,အခြေအနေ",
    "volunteer.comprehensiveView": "ကွန်ယက်တစ်ခုရှိစေတနာ့ဝန်ထမ်းများ၏ကျယ်ကျယ်ပြန့်ပြန့်ကြည့်ရှုခြင်း",

    // Family Tab
    "family.sendRequest": "တောင်းဆိုမှုပို့ပြီး",
    "family.relation": "ခင်ဆက်ဆံမှု",
    "family.mother": "မိခင်",
    "family.father": "ခအဖ",
    "family.brother": "ညီ",
    "family.sister": "သမီး",
    "family.wife": "ဇနီး",
    "family.husband": "ခင်ပွန်း",
    "family.son": "သား",
    "family.daughter": "သမီး",
    "family.pending": "စောင့်ဆိုင်းဆဲ",
    "family.relationLabel": "ခင်ဆက်ဆံမှု:",
    "family.lastSeenLabel": "နောက်ဆုံးမြင်ရ:",
    "family.viewMap": "မြေပုံကြည့်ရှုပါ",

    // Admin Page Additional
    "admin.orgName_label": "အဖွဲ့အစည်းအမည်",
    "admin.orgEmail_label": "အီးမေးလ်",
    "admin.orgPhone_label": "ဖုန်း",
    "admin.orgAddress_label": "လိပ်စာ",
    "admin.orgPassword_label": "စကားဝှက်",
    "admin.orgRegion_label": "ဒေသ",
    "admin.orgFunding_label": "ငွေကြေးထောက်ပံ့မှု",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // Load persisted language from localStorage on mount
    try {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && ["en", "my"].includes(savedLanguage)) {
        setLanguage(savedLanguage);
        // also set document lang for accessibility
        if (typeof document !== 'undefined') document.documentElement.lang = savedLanguage;
      }
    } catch (err) {
      // localStorage may be unavailable in some environments
      console.warn('Could not read saved language from localStorage', err);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem("language", lang);
    } catch (err) {
      console.warn('Could not persist language to localStorage', err);
    }
    // update document lang for screen readers / i18n
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    // Return translation for current language, fallback to English, then key
    return (
      (translations as any)[language]?.[key] ||
      (translations as any).en?.[key] ||
      key
    );
  };

  return (
    <TranslationContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
