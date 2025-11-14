# Dual Language Feature - Complete Expansion Guide

## ✅ What's Implemented

### Language Provider (`src/hooks/use-language.tsx`)
- ✅ 200+ translation keys for English & Myanmar
- ✅ Persistent language selection via localStorage
- ✅ Document `lang` attribute updates
- ✅ Safe fallback chain: current language → English → key

### Translation Categories

#### 1. **Navigation (14 keys)**
- `nav.map`, `nav.safety`, `nav.volunteers`, `nav.organizations`, `nav.dashboard`, `nav.family`, `nav.profile`, `nav.admin`, `nav.aiChat`, `nav.login`, `nav.register`, `nav.logout`, `nav.recentAlerts`

#### 2. **Map/Incident (22 keys)**
- Titles: `map.title`, `map.subtitle`, `map.currentLocation`
- Status: `map.pending`, `map.confirmed`, `map.completed`
- UI: `map.done`, `map.selectLocation`, `map.changeLocation`, `map.legend`, `map.recentReports`, `map.quickStats`, `map.damagedAreas`, `map.safeZones`, `map.title_label`, `map.loading`, `map.reloadPage`, `map.noCoordinates`
- Form: `map.addPin`, `map.damagedLocation`, `map.safeZone`, `map.description`, `map.uploadImage`, `map.submit`, `map.cancel`

#### 3. **Authentication (16 keys)**
- `auth.login`, `auth.register`, `auth.email`, `auth.password`, `auth.name`, `auth.phone`, `auth.role`, `auth.user`, `auth.trackingVolunteer`, `auth.supplyVolunteer`, `auth.organization`, `auth.admin`, `auth.selectOrganization`, `auth.createAccount`, `auth.alreadyHaveAccount`, `auth.dontHaveAccount`

#### 4. **Registration Form (10 keys)**
- `register.user`, `register.organization`, `register.enterFullName`, `register.enterEmail`, `register.enterPhone`, `register.enterOrgPhone`, `register.enterOrgAddress`, `register.enterPassword`, `register.confirmPassword`, `register.agreeTerms`

#### 5. **Dashboard (6 keys)**
- `dashboard.welcome`, `dashboard.emergencyKit`, `dashboard.familyMembers`, `dashboard.safetyModules`, `dashboard.recentAlerts`, `dashboard.quickActions`

#### 6. **Family Locator (19 keys)**
- Alerts: `family.checkSent`, `family.checkFailed`, `family.cancelFailed`, `family.specifyRelation`, `family.requestSent`, `family.alreadyInNetwork`, `family.alreadyRequested`, `family.sendRequestFailed`, `family.errorOccurred`, `family.unlinkFailed`
- UI: `family.title`, `family.addMember`, `family.memberName`, `family.memberPhone`, `family.uniqueId`, `family.imSafe`, `family.areYouOk`, `family.lastSeen`, `family.status`
- Form: `family.sendRequest`, `family.relation`, `family.mother`, `family.father`, `family.brother`, `family.sister`, `family.wife`, `family.husband`, `family.son`, `family.daughter`, `family.pending`, `family.relationLabel`, `family.lastSeenLabel`, `family.viewMap`

#### 7. **Safety Modules (8 keys)**
- `safety.title`, `safety.cpr`, `safety.firstAid`, `safety.earthquake`, `safety.emergency`, `safety.locked`, `safety.progress`, `safety.start`, `safety.continue`, `safety.completed`, `safety.moduleLocked`

#### 8. **Volunteers (18 keys)**
- `volunteer.title`, `volunteer.pendingPins`, `volunteer.confirm`, `volunteer.deny`, `volunteer.assignments`, `volunteer.supplyRoutes`, `volunteer.markDelivered`, `volunteer.onTheWay`
- New: `volunteer.viewConnect`, `volunteer.totalActive`, `volunteer.activeVolunteers`, `volunteer.onMission`, `volunteer.totalMissions`, `volunteer.avgRating`, `volunteer.searchPlaceholder`, `volunteer.listView`, `volunteer.trackingVolunteers`, `volunteer.supplyVolunteers`, `volunteer.allRoles`, `volunteer.allStatus`, `volunteer.active`, `volunteer.tableHeaders`, `volunteer.comprehensiveView`

#### 9. **Organizations (23 keys)**
- `org.title`, `org.volunteerManagement`, `org.helpRequests`, `org.approve`, `org.reject`, `org.assign`, `org.collaboration`
- New: `org.analytics`, `org.refresh`, `org.noOrganizations`, `org.activeOrganizations`, `org.pendingApproval`, `org.totalVolunteers`, `org.supplies`, `org.medical`, `org.food`, `org.water`, `org.shelter`, `org.equipment`, `org.noSupplies`, `org.tableHeaders`, `org.editOrganization`, `org.manageOrgs`

#### 10. **Admin (15 keys)**
- `admin.title`, `admin.registerOrg`, `admin.orgName`, `admin.orgUsername`, `admin.orgPassword`, `admin.orgRegion`, `admin.orgFunding`, `admin.manageOrgs`, `admin.edit`, `admin.delete`
- Alerts: `admin.fillRequired`, `admin.createError`, `admin.createSuccess`, `admin.updateError`, `admin.updateSuccess`
- Additional: `admin.orgName_label`, `admin.orgEmail_label`, `admin.orgPhone_label`, `admin.orgAddress_label`, `admin.orgPassword_label`, `admin.orgRegion_label`, `admin.orgFunding_label`

#### 11. **Common UI (24 keys)**
- `common.loading`, `common.error`, `common.success`, `common.save`, `common.cancel`, `common.delete`, `common.edit`, `common.view`, `common.search`, `common.filter`, `common.refresh`, `common.close`, `common.yes`, `common.no`, `common.ok`, `common.submit`, `common.back`, `common.next`, `common.previous`

#### 12. **Emergency (6 keys)**
- `emergency.alert`, `emergency.shelter`, `emergency.evacuate`, `emergency.supplies`, `emergency.contact`, `emergency.instructions`

---

## 🔧 How to Use Translations in Components

### **Pattern 1: Direct Translation**
```typescript
import { useLanguage } from '@/hooks/use-language'

export function MyComponent() {
  const { t } = useLanguage()
  
  return <Button>{t('common.save')}</Button>
}
```

### **Pattern 2: With Conditionals**
```typescript
const { t, language } = useLanguage()

return (
  <div>
    <h1>{t('map.title')}</h1>
    <p>{t(language === 'en' ? 'map.loading' : 'map.loading')}</p>
  </div>
)
```

### **Pattern 3: In Alerts**
```typescript
alert(t('family.checkSent'))
```

### **Pattern 4: In Forms/Inputs**
```typescript
<Input placeholder={t('register.enterEmail')} />
<Label>{t('admin.orgName_label')}</Label>
```

---

## 📋 Hardcoded Strings Still to Replace (By Priority)

### **HIGH PRIORITY** (Visible to all users)
These appear in UI buttons, labels, and placeholders:

**File: `src/app/register/page.tsx`**
- Line 159: `placeholder="Enter your full name"` → Use `t('register.enterFullName')`
- Line 172: `placeholder="Enter your email"` → Use `t('register.enterEmail')`
- Line 208: `placeholder="Enter organization address"` → Use `t('register.enterOrgAddress')`
- Line 226: `placeholder="Enter password"` → Use `t('register.enterPassword')`
- Line 286: `"I agree to the terms..."` → Use `t('register.agreeTerms')`

**File: `src/app/page1.tsx` (Map Page)**
- Line 496: `placeholder="Enter title..."` → Use `t('map.title_label')`
- Line 607: Button text "Done" → Use `t('map.done')`
- Line 663: "Legend" header → Use `t('map.legend')`
- Line 670: "Recent Reports" → Use `t('map.recentReports')`
- Line 710-721: Stats labels → Use corresponding `org.` keys

**File: `src/app/admin/page.tsx`**
- Line 1660: `placeholder="Enter organization name"` → Use `t('admin.orgName_label')`
- Line 1676: `placeholder="Enter email address"` → Use `t('admin.orgEmail_label')`
- Line 1691: `placeholder="Enter phone number"` → Use `t('admin.orgPhone_label')`
- Line 1707: `placeholder="Enter password"` → Use `t('admin.orgPassword_label')`
- Line 1758: `placeholder="Enter funding amount"` → Use `t('admin.orgFunding_label')`
- Line 1773: `placeholder="Enter organization address"` → Use `t('admin.orgAddress_label')`

**File: `src/components/family-tab.tsx`**
- Line 396: "Send Request" button → Use `t('family.sendRequest')`
- Line 402: "Relation" label → Use `t('family.relation')`
- Line 407: Placeholder → Use `t('family.relation')`
- Line 411-418: Quick action buttons (Mother, Father, etc.) → Use family relationship keys
- Line 448-452: Labels → Use `family.relationLabel`, `family.lastSeenLabel`
- Line 470: Map button → Use `t('family.viewMap')`
- Line 484: "Unlink" button → Use `t('common.delete')` or create `family.unlink` key

**File: `src/app/volunteers/page.tsx`**
- Line 169: Page title → Use `t('volunteer.title')`
- Line 172: Page description → Use `t('volunteer.viewConnect')`
- Line 181-185: Stats labels → Use volunteer keys
- Line 259: Search placeholder → Use `t('volunteer.searchPlaceholder')`
- Line 271-283: Dropdown options → Use volunteer filter keys

**File: `src/app/organization/page.tsx`**
- Line 833-837: Tab triggers → Use org keys
- Line 871: Table headers → Use org table header keys
- Line 910-920: Supply labels → Use `org.medical`, `org.food`, etc.

### **MEDIUM PRIORITY** (Status messages, empty states)
- Empty state messages → Create `empty.*` keys
- Loading messages → Already have `common.loading`
- Error messages → Already have `common.error`

### **LOW PRIORITY** (Help text, descriptions)
- Tooltips and help text → Create `help.*` keys
- Card descriptions → Create `card.*` keys

---

## 🚀 Quick Implementation Steps

### 1. **Immediate (15 min)**
All register & map form placeholders:
```bash
# src/app/register/page.tsx
# src/app/page1.tsx
```

### 2. **Next (30 min)**
Admin and organization pages:
```bash
# src/app/admin/page.tsx
# src/app/organization/page.tsx
```

### 3. **Complete (1 hour)**
Family tab and volunteers:
```bash
# src/components/family-tab.tsx
# src/app/volunteers/page.tsx
```

---

## ✨ Current Coverage

### Fully Translated Pages
- ✅ Navigation (all buttons toggle language)
- ✅ Family Tab (all alerts use t())
- ✅ Safety Module (locked message translated)
- ✅ Admin Page (all alerts translated)

### Partially Translated
- ⚠️ Register Page (form field labels needed)
- ⚠️ Map Page (UI text & placeholders)
- ⚠️ Organization Page (some UI text)
- ⚠️ Volunteers Page (column headers, filters)

### Not Yet Translated
- ❌ Button labels in modals/dialogs
- ❌ Some table headers
- ❌ Relationship quick-select buttons

---

## 🧪 Testing

1. **Toggle Language**
   - Click language toggle in navigation
   - Verify document.documentElement.lang changes
   - Refresh page → language persists

2. **Check Coverage**
   - Switch to Myanmar
   - All visible text should be in Myanmar
   - Untranslated strings will show their key (e.g., "register.enterEmail")

3. **Check Alerts**
   - Trigger family alerts
   - Trigger admin alerts
   - Verify alerts appear in selected language

---

## 📝 Notes

- All translations are in `src/hooks/use-language.tsx`
- Language preference stored in browser localStorage
- Missing translations fall back to English, then show the key
- `t()` function is reactive - component re-renders when language changes
- Document `lang` attribute helps with font rendering and accessibility

