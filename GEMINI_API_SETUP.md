# Gemini API Key Management - Quick Setup Guide

A production-ready, highly secure system for managing user Gemini API keys with AES-256-GCM encryption.

## 🚀 Quick Setup (5 minutes)

### 1. Add Encryption Key to Environment

The setup script has generated an encryption key. Add it to your `.env.local`:

```env
ENCRYPTION_KEY=27649405a3719747054a7e6af139146e7258e00b0b649852072eab8ebfa7178b
```

> ⚠️ **IMPORTANT**: Never commit `.env.local` to version control!

### 2. Run Database Migration

Execute the SQL schema in Supabase Dashboard:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copy contents of [`models/gemini_api_keys.sql`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/models/gemini_api_keys.sql)
3. Click "Run" to execute
4. Verify: Table Editor → `gemini_api_keys` table should exist

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Test the Feature

1. Navigate to **Profile Page** → **Preferences**
2. Find "**Gemini API Key**" input field
3. Enter your Gemini API key (get from [Google AI Studio](https://aistudio.google.com/app/apikey))
4. Wait 3 seconds → Should show masked preview (`AIza***`)

✅ **Done!** The system is ready to use.

---

## 📁 Files Created

| File                                                                                                                                | Purpose                           |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`models/gemini_api_keys.sql`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/models/gemini_api_keys.sql)                           | Database schema with RLS policies |
| [`src/lib/encryption.ts`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/src/lib/encryption.ts)                                     | AES-256-GCM encryption utilities  |
| [`app/api/gemini/route.ts`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/app/api/gemini/route.ts)                                 | CRUD API for key management       |
| [`app/api/gemini/recommendations/route.ts`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/app/api/gemini/recommendations/route.ts) | AI recommendations endpoint       |
| [`app/profile/page.tsx`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/app/profile/page.tsx)                                       | Frontend UI with debounced input  |
| [`scripts/setup-gemini-encryption.js`](file:///Users/lowkeyarhan/Desktop/Riyura%202.0/scripts/setup-gemini-encryption.js)           | Key generation utility            |

---

## 🔒 Security Features

- ✅ **AES-256-GCM encryption** (industry standard)
- ✅ **Server-side decryption only** (frontend never sees plaintext)
- ✅ **Row-level security** (users only see own keys)
- ✅ **Unique IVs** per encryption (prevents pattern analysis)
- ✅ **Authentication tags** (prevents tampering)
- ✅ **Zero plaintext logging** (comprehensive audit trail without sensitive data)

---

## 🎯 Usage

### For Users

**Add API Key:**

1. Go to Profile → Preferences
2. Paste Gemini API key
3. Wait 3s → Auto-saves with masked display

**Remove API Key:**

1. Clear the input field
2. Wait 3s → Auto-deletes

### For Developers

**Get Recommendations:**

```typescript
const session = await supabase.auth.getSession();
const res = await fetch("/api/gemini/recommendations", {
  headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
});
const { recommendations } = await res.json();
```

---

## 📚 Documentation

- **Full Walkthrough**: [`walkthrough.md`](file:///Users/lowkeyarhan/.gemini/antigravity/brain/7626ce57-9a90-4d42-852a-263a777044fa/walkthrough.md)
- **Implementation Plan**: [`implementation_plan.md`](file:///Users/lowkeyarhan/.gemini/antigravity/brain/7626ce57-9a90-4d42-852a-263a777044fa/implementation_plan.md)

---

## ✅ Verification Checklist

- [ ] Added `ENCRYPTION_KEY` to `.env.local`
- [ ] Ran database migration in Supabase
- [ ] Restarted development server
- [ ] Tested API key input in Profile page
- [ ] Verified encrypted storage in Supabase table editor
- [ ] (Optional) Tested recommendations endpoint

---

## 🆘 Troubleshooting

**"ENCRYPTION_KEY not set" error**
→ Add key to `.env.local` and restart server

**Key won't save**
→ Check browser console for errors
→ Verify authorization token in Network tab

**Recommendations fail**
→ Verify Gemini API key is valid
→ Check server logs for detailed error

---

**Need Help?** See full documentation in [`walkthrough.md`](file:///Users/lowkeyarhan/.gemini/antigravity/brain/7626ce57-9a90-4d42-852a-263a777044fa/walkthrough.md)
