const http=require("http"),fs=require("fs"),path=require("path");
const port=process.env.PORT||3000,root=__dirname;
const types={".html":"text/html",".css":"text/css",".js":"application/javascript",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".mp4":"video/mp4"};
http.createServer((req,res)=>{
 let pathname=decodeURIComponent(req.url.split("?")[0]);if(pathname==="/")pathname="/index.html";
 const file=path.join(root,pathname);
 if(!file.startsWith(root)){res.writeHead(403);return res.end("Forbidden")}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404);return res.end("Not found")}
  const ext=path.extname(file).toLowerCase();
  res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream","Cache-Control":"no-cache"});
  fs.createReadStream(file).pipe(res);
 });
}).listen(port,()=>console.log(`TNYPL preview running on port ${port}`));