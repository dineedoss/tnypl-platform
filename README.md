# TNYPL League Platform

This is a deployable MVP for the Tamil Nadu Youth Premier League.

## Included
- Public league homepage
- U13–U14 player registration
- Date-of-birth validation
- CricHeroes profile field
- Mandatory age-proof upload
- Mandatory payment-receipt upload
- YouTube video/livestream embed
- Admin login
- Registration counts
- Payment verification
- Age verification
- Draft eligibility
- Player search/filter
- CSV export

## 1. Create Supabase
1. Create a free project at Supabase.
2. Open SQL Editor.
3. Run `supabase-schema.sql`.
4. In Authentication, create your admin user.
5. In Project Settings > API, copy:
   - Project URL
   - anon public key

## 2. Configure
Open `config.js` and replace:
- YOUR_SUPABASE_URL
- YOUR_SUPABASE_ANON_KEY
- YOUR_YOUTUBE_VIDEO_ID

Set the official U13–U14 DOB window using `MIN_DOB` and `MAX_DOB`.
Do not publish until the tournament's age cutoff rule is confirmed.

## 3. Deploy to Netlify
Drag this folder into Netlify deploys or connect it to GitHub.
Your current Netlify site can be replaced by deploying this folder.

## 4. Admin
Open `/admin.html` and log in with the Supabase admin email/password.

## Important
The document bucket is private. Admins can inspect uploaded files through the Supabase dashboard.
For stronger production security, add an `admin_users` table and restrict policies to approved admin IDs.
