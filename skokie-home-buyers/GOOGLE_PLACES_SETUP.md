# Google Places API Setup Guide

The app now has address autocomplete that suggests only valid Skokie, IL addresses. This prevents users from entering invalid addresses and getting errors.

## How It Works

**Primary**: Google Places Autocomplete (when API key is configured)
- Shows real addresses as user types
- Filters to only Skokie, IL (60076)
- Validates addresses before submission

**Fallback**: HTML Datalist (works without API key)
- Shows predefined list of common Skokie addresses
- Works even if Google API fails or isn't configured

## Setup Google Places API (Optional but Recommended)

### Step 1: Get a Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept terms of service

### Step 2: Create a Project

1. Click project dropdown at top
2. Click "New Project"
3. Name it (e.g., "Skokie Home Buyers")
4. Click "Create"

### Step 3: Enable Places API

1. Go to **APIs & Services** > **Library**
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

### Step 4: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "API Key"
3. Copy the API key shown

### Step 5: Restrict Your API Key (Important!)

For security, restrict your API key:

1. In the API key dialog, click "Edit API key"
2. Under **Application restrictions**:
   - Select "HTTP referrers (websites)"
   - Add your domain: `localhost:5188/*` (for testing)
   - Add production domain: `yourdomain.com/*`

3. Under **API restrictions**:
   - Select "Restrict key"
   - Check only "Places API"

4. Click "Save"

### Step 6: Add API Key to Your App

Open `index.html` and replace `YOUR_GOOGLE_API_KEY`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_KEY_HERE&libraries=places&callback=initAutocomplete" async defer></script>
```

**Example:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC_EXAMPLE_KEY_12345&libraries=places&callback=initAutocomplete" async defer></script>
```

### Step 7: Enable Billing (Required)

Google requires a billing account, but the free tier is very generous:

1. Go to **Billing** in Google Cloud Console
2. Click "Link a billing account"
3. Add payment method (credit card)
4. You get **$200 free credits** per month
5. Places Autocomplete is free for first **25,000+ requests/month**

**Monthly Cost Estimate:**
- Small site (100 visitors/day): **FREE**
- Medium site (1,000 visitors/day): **FREE**
- Large site (10,000 visitors/day): ~$10-20/month

### Step 8: Test It

1. Start your server: `cd backend && node server.js`
2. Open `http://localhost:5188`
3. Click in the address field
4. Start typing an address (e.g., "8234 Oak")
5. You should see Skokie address suggestions

## Without Google API Key

If you don't want to use Google API, the app still works with the fallback datalist:

1. Users type in the address field
2. Browser shows predefined list of Skokie addresses
3. Users can select from the list or type manually
4. Validation happens on backend

The datalist is already configured with common Skokie addresses.

## Troubleshooting

### "Google is not defined" error
- Check that API key is correct
- Verify script loads before `initAutocomplete` is called
- Open browser console to see errors

### Autocomplete not showing
- Verify API key has "Places API" enabled
- Check HTTP referrer restrictions
- Make sure billing is enabled

### Wrong addresses appearing
- Check that `strictBounds` is set to `true` in `script.js`
- Verify Skokie coordinates are correct

### API quota exceeded
- Check usage in Google Cloud Console
- Upgrade to paid tier if needed (still cheap)
- Implement caching to reduce requests

## Features

✅ Smart address suggestions as user types
✅ Only shows Skokie, IL addresses
✅ Validates address before submission
✅ Prevents "invalid address" errors
✅ Mobile-friendly autocomplete
✅ Falls back to datalist if Google fails

## Cost Breakdown

| Traffic | Monthly Requests | Cost |
|---------|-----------------|------|
| 10 visitors/day | ~300 | FREE |
| 100 visitors/day | ~3,000 | FREE |
| 1,000 visitors/day | ~30,000 | ~$5-10 |
| 10,000 visitors/day | ~300,000 | ~$50-100 |

**Free tier**: 25,000 requests/month included

## Alternative: No API Key Needed

If you prefer not to use Google API at all, you can remove the Google script from `index.html` and just use the datalist. The app will work fine, just without real-time address validation.

To remove Google API:

1. Delete this line from `index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=..."></script>
```

2. The datalist will still provide address suggestions

The datalist approach is free and works offline, but won't validate addresses or show dynamic results.
