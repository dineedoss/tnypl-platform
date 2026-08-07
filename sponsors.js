const sp=supabase.createClient(TNYPL_CONFIG.SUPABASE_URL,TNYPL_CONFIG.SUPABASE_ANON_KEY);
async function showSponsors(){
 const {data,error}=await sp.from("sponsors").select("*").eq("is_active",true).order("display_order");
 const fallback=[
 {name:"The Cake Point",logo_path:"sponsor-cake-point.png",website_url:"https://www.cakepoint.in/"},
 {name:"Ayyappa Auto Agencies",logo_path:"sponsor-ayyappa-auto.png"},
 {name:"DOJO MAN Sports Event App",logo_path:"sponsor-dojo-man.png",website_url:"https://www.dojoman.com/"},
 {name:"Vedapile",logo_path:"sponsor-vedapile.png",website_url:"https://vedapile.com/"}
 ];
 const rows=error||!data?.length?fallback:data;
 publicSponsorGrid.innerHTML=rows.map(s=>`<article><div class="sponsor-card">${s.website_url?`<a href="${s.website_url}" target="_blank" rel="noopener">`:""}<img src="${s.logo_path}" alt="${s.name}">${s.website_url?"</a>":""}</div><div class="sponsor-name">${s.name}</div></article>`).join("");
}
showSponsors();