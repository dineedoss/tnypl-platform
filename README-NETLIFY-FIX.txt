TNYPL V8 NETLIFY DEPENDENCY FIX

Fixes Netlify build error:
Cannot find module @supabase/supabase-js

Added top-level dependency:
@supabase/supabase-js ^2.57.4

DEPLOY:
unzip -o TNYPL_V8_Netlify_Fix.zip -d /tmp/tnypl-netlify-fix
cp -r /tmp/tnypl-netlify-fix/* .
npm install
git add package.json package-lock.json .
git commit -m "Fix Netlify Supabase function dependency"
git push origin main
