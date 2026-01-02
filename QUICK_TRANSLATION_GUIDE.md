# Quick Translation Implementation Guide

## How to Translate Any Page (3 Steps)

### Step 1: Make Component Client-Side & Import Hooks
Add `"use client";` at the top and import hooks:

```typescript
"use client";

import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/translations";
```

### Step 2: Use Hooks in Component
```typescript
export default function YourPage() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  // rest of your component
}
```

### Step 3: Replace Text with t() Function
```typescript
// Before:
<h1>Welcome back</h1>

// After:
<h1>{t("Welcome back")}</h1>
```

## Common Patterns

### Headers/Titles
```typescript
<h1>{t("Dashboard")}</h1>
<h2>{t("My Subscription")}</h2>
<CardTitle>{t("Active Subscription")}</CardTitle>
```

### Buttons
```typescript
<Button>{t("Subscribe Now")}</Button>
<Button>{t("Save Changes")}</Button>
```

### Form Labels
```typescript
<Label>{t("Email")}</Label>
<Label>{t("Password")}</Label>
<Input placeholder={t("Enter new password")} />
```

### Conditional Text (Brand Name)
```typescript
<span>{language === "ar" ? "نادي الصحة" : "Healthy Club"}</span>
```

### Already Translated
All these keys are ready to use - no need to add to translations.ts:

**Navigation**
- Home, Menu, Packages, Login, Register, Dashboard, Logout

**Actions**
- Subscribe Now, Save, Cancel, Edit, Delete, Submit, Search, Filter

**Dashboard**
- Overview, My Subscription, Orders, Profile
- Total Orders, Days Remaining, Total Spent, Active Plans
- Pause Subscription, Resume Subscription, Cancel Subscription

**Forms**
- Email, Password, Full Name, Phone Number
- Create Account, Sign in, Loading...

**Package Types**
- Normal, Keto, Vegetarian, Special
- Breakfast, Lunch, Dinner, Snacks

**Contact**
- Contact Us, Address, Phone Number, WhatsApp Us
- Bahrain, Follow Us

## Example: Translate app/page.tsx Landing Page

### Original (English only):
```typescript
export default function Home() {
  return (
    <main>
      <h1>Healthy Club</h1>
      <p>Fresh Meal Subscriptions</p>
      <Button>Start Now</Button>
    </main>
  );
}
```

### Translated:
```typescript
"use client";

import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/translations";
// ... other imports

export default function Home() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <main>
      <h1>
        <span className="text-green-700">
          {language === "ar" ? "نادي" : "Healthy"}
        </span>{" "}
        <span className="text-blue-500">
          {language === "ar" ? "الصحة" : "Club"}
        </span>
      </h1>
      <p>{t("Fresh Meal Subscriptions")}</p>
      <Button>{t("Start Now")}</Button>
    </main>
  );
}
```

## Need a New Translation?

If you need text that's not in translations.ts, add it:

1. Open `lib/translations.ts`
2. Add to both `ar` and `en` objects:

```typescript
export const translations = {
  ar: {
    // ... existing
    "Your New Text": "النص الجديد",
  },
  en: {
    // ... existing
    "Your New Text": "Your New Text",
  },
};
```

## RTL-Specific Tips

### Use Logical Properties
```typescript
// Good (works in both LTR/RTL):
className="ms-4 ps-2"  // margin-start, padding-start

// Avoid (LTR only):
className="ml-4 pl-2"  // margin-left, padding-left
```

### Conditional RTL
```typescript
// For specific cases:
<div className={language === "ar" ? "text-right" : "text-left"}>

// Sheet/Dialog side
<SheetContent side={language === "ar" ? "left" : "right"}>
```

### Icons Stay LTR
Most icons work fine in RTL, but some may need flipping:
```typescript
// Arrow icons might need conditional rotation
<ChevronRight className={language === "ar" ? "rotate-180" : ""} />
```

## Priority Pages to Translate

1. ✅ **Header** - DONE
2. ✅ **Footer** - DONE
3. ⚠️ **app/page.tsx** (Landing) - UPDATE ALL TEXT
4. ⚠️ **app/login/page.tsx** - Simple
5. ⚠️ **app/register/page.tsx** - Simple
6. ⚠️ **app/dashboard/page.tsx** - Medium complexity
7. ⚠️ **app/subscribe/page.tsx** - Forms
8. **app/subscribe/success/page.tsx** - Simple
9. **components/forms/*.tsx** - Forms
10. **app/admin/** pages - Lower priority

## Testing Checklist

For each page you translate:

- [ ] Import hooks correctly
- [ ] Component is "use client"
- [ ] All visible text uses t()
- [ ] Test in Arabic mode
- [ ] Test in English mode
- [ ] Check RTL layout
- [ ] Verify localStorage persistence
- [ ] Check mobile view

## Quick Debug

If translations don't work:
1. Is component "use client"?
2. Did you import useLanguage and useTranslation?
3. Did you call them inside component (not at top level)?
4. Is translation key in translations.ts?
5. Check browser console for errors

## Complete Example: Login Page

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/LoginForm";
import Link from "next/link";
import { Suspense } from "react";
import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/translations";

export default function LoginPage() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("Login")}</CardTitle>
          <CardDescription>{t("Access your Healthy Club account")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-sm text-muted-foreground">
            {t("Don't have an account?")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t("Register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
```

That's it! 🎉

The system is designed to be simple:
1. Import hooks
2. Use t() for all text
3. Done

All infrastructure is ready - just wrap your text with t()!
