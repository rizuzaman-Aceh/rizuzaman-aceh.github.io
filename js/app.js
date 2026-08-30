(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    menuBtn.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };
  menuBtn?.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("resize", () => { if (innerWidth > 767) setMenu(false); }, {passive:true});

  /* ---------- Scroll progress + scroll spy ---------- */
  const progress = $("#scrollProgress");
  const navLinks = $$("#desktopNav a");
  const sections = $$("main section[id]");
  let ticking = false;
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
    if (progress) progress.style.width = pct + "%";
    let current = "home";
    const marker = scrollY + innerHeight * 0.28;
    sections.forEach(section => {
      if (marker >= section.offsetTop) current = section.id;
    });
    navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + current));
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(updateScrollUI); ticking = true; }
  }, {passive:true});
  updateScrollUI();

  /* ---------- Reveal + skill rings ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      $$(".ring", entry.target).forEach(ring => {
        const value = Number(ring.dataset.value || 0);
        const circle = $(".ring-fg", ring);
        if (circle) {
          const circumference = 2 * Math.PI * 43;
          circle.style.strokeDashoffset = String(circumference * (1 - value / 100));
        }
      });
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:.08, rootMargin:"0px 0px -40px 0px"});
  $$(".reveal").forEach(el => revealObserver.observe(el));

  /* ---------- Custom cursor, desktop only ---------- */
  if (!coarse && innerWidth > 1024 && !reduced) {
    const dot = $("#cursorDot"), ring = $("#cursorRing");
    let x = 0, y = 0, rx = 0, ry = 0;
    document.addEventListener("mousemove", e => { x=e.clientX; y=e.clientY; }, {passive:true});
    const cursorLoop = () => {
      rx += (x-rx)*.18; ry += (y-ry)*.18;
      if(dot) dot.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      if(ring) ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(cursorLoop);
    };
    cursorLoop();
    $$("a,button,.glass,.flip-card,input,textarea").forEach(el => {
      el.addEventListener("mouseenter", () => { if(dot) dot.style.width="13px"; if(dot) dot.style.height="13px"; if(ring){ring.style.width="42px";ring.style.height="42px";ring.style.borderColor="rgba(29,78,216,.45)";} });
      el.addEventListener("mouseleave", () => { if(dot) dot.style.width="7px"; if(dot) dot.style.height="7px"; if(ring){ring.style.width="28px";ring.style.height="28px";ring.style.borderColor="rgba(255,255,255,.25)";} });
    });
  }

  /* ---------- Matrix rain: capped, paused off-screen/tab ---------- */
  const matrix = $("#matrixCanvas");
  if (matrix && !reduced) {
    const ctx = matrix.getContext("2d", {alpha:true});
    let drops = [], width=0, height=0, font=12, raf=0, running=false;
    const chars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｦｱｳｴｵ";
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      width = innerWidth; height = innerHeight; font = innerWidth < 480 ? 10 : 12;
      matrix.width = Math.floor(width*dpr); matrix.height = Math.floor(height*dpr);
      matrix.style.width = width+"px"; matrix.style.height = height+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const cols = Math.ceil(width/font);
      drops = Array.from({length:cols}, () => Math.random()*-40);
    };
    const frame = () => {
      if(!running) return;
      ctx.fillStyle="rgba(10,10,10,.075)"; ctx.fillRect(0,0,width,height);
      ctx.font=`${font}px "JetBrains Mono",monospace`;
      for(let i=0;i<drops.length;i++){
        const y=drops[i]*font;
        ctx.fillStyle = Math.random()>.94 ? "rgba(230,36,41,.22)" : "rgba(34,211,238,.16)";
        ctx.fillText(chars[(Math.random()*chars.length)|0], i*font, y);
        drops[i] += .55;
        if(y>height && Math.random()>.985) drops[i]=Math.random()*-12;
      }
      raf=requestAnimationFrame(frame);
    };
    const start=()=>{if(!running){running=true;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}};
    const stop=()=>{running=false;cancelAnimationFrame(raf)};
    resize(); addEventListener("resize",resize,{passive:true});
    document.addEventListener("visibilitychange",()=>document.hidden?stop():start());
    start();
  }

  /* ---------- Terminal typing, safe text rendering ---------- */
  const terminal = $("#terminalBody");
  const terminalLines = [
    ["whoami → Rizu Zaman", "ok"],
    ["nmap -sV localhost → 22/ssh · 80/http · 443/https", "cyan"],
    ["sudo apt-get install security-tools → installation complete", "ok"],
    ["systemctl status firewall → active (running)", "ok"],
    ["python3 exploit-check.py → scanning vulnerabilities...", "warn"],
    ["git push origin master → pushed successfully", "gold"]
  ];
  if (terminal) {
    let li=0, ci=0, timer=0;
    const type = () => {
      if (document.hidden) { timer=setTimeout(type,500); return; }
      if (li >= terminalLines.length) {
        timer=setTimeout(() => { terminal.textContent=""; li=0; ci=0; type(); }, 4200);
        return;
      }
      let text="";
      for(let i=0;i<li;i++) text += "$ " + terminalLines[i][0] + "\n";
      text += "$ " + terminalLines[li][0].slice(0,ci);
      terminal.textContent=text;
      const cursor=document.createElement("span");
      cursor.className="terminal-cursor";
      terminal.appendChild(cursor);
      ci++;
      if(ci > terminalLines[li][0].length){li++;ci=0;timer=setTimeout(type,260)}
      else timer=setTimeout(type, reduced?8:68);
    };
    type();
    document.querySelector("#terminalRun")?.addEventListener("click",()=>{ terminal.textContent=""; li=0; ci=0; clearTimeout(timer); type(); });
  }

  if(window.lucide){ window.lucide.createIcons({attrs:{"stroke-width":1.7}}); }

  /* ---------- Threat level simulation ---------- */
  const threat = $("#threatValue"), bar=$("#threatBar"), score=$("#threatScore");
  let threatScore=12;
  const updateThreat = () => {
    threatScore = Math.max(5, Math.min(28, threatScore + (Math.random()-.5)*7));
    const n=Math.round(threatScore);
    const level=n<14?"LOW":n<21?"MEDIUM":"HIGH";
    threat?.classList.remove("low","medium","high"); threat?.classList.add(level.toLowerCase());
    if(threat) threat.textContent=level;
    if(bar){bar.style.width=n+"%";bar.style.background=level==="LOW"?"#31df76":level==="MEDIUM"?"#e9bf38":"#ff5268";}
    if(score) score.textContent=`Skor: ${n}/100 · ${level==="LOW"?"Normal":"Monitoring aktif"}`;
  };
  if(!reduced) setInterval(updateThreat, 3400);

  /* ---------- Traffic canvas: pause when invisible ---------- */
  const traffic=$("#trafficCanvas");
  if(traffic){
    const ctx=traffic.getContext("2d");
    let data=Array.from({length:34},()=>Math.random()*.55+.2), running=false, raf=0, last=0;
    const resizeTraffic=()=>{const rect=traffic.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio||1,2); traffic.width=Math.max(1,Math.floor(rect.width*dpr));traffic.height=Math.max(1,Math.floor(rect.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0)};
    const draw=(time=0)=>{
      if(!running)return;
      if(time-last<55){raf=requestAnimationFrame(draw);return}
      last=time;
      const w=traffic.clientWidth,h=traffic.clientHeight;
      ctx.clearRect(0,0,w,h);ctx.beginPath();
      data.forEach((v,i)=>{const x=i/(data.length-1)*w,y=h-v*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
      ctx.strokeStyle="rgba(29,78,216,.65)";ctx.lineWidth=1.2;ctx.shadowBlur=7;ctx.shadowColor="rgba(29,78,216,.3)";ctx.stroke();ctx.shadowBlur=0;
      data.push(Math.random()*.62+.12);data.shift();
      raf=requestAnimationFrame(draw);
    };
    const start=()=>{if(!running){running=true;resizeTraffic();raf=requestAnimationFrame(draw)}};
    const stop=()=>{running=false;cancelAnimationFrame(raf)};
    new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop()),{threshold:.08}).observe(traffic);
    addEventListener("resize",resizeTraffic,{passive:true});
  }

  /* ---------- Security event stream ---------- */
  const log=$("#securityLog");
  if(log && !reduced){
    const entries=[
      ["✓","TLS handshake validated","log-ok"],["⚡","Packet inspected (TLS 1.3)","log-cyan"],
      ["✓","Certificate validated (OCSP)","log-ok"],["⚠","WAF blocked XSS attempt","log-warn"],
      ["✓","Ruleset synchronized","log-ok"],["✓","Audit log rotated","log-ok"],
      ["🔍","Vulnerability scan completed","log-cyan"],["✓","No anomaly detected","log-ok"]
    ];
    let idx=0, visible=true;
    new IntersectionObserver(es=>visible=es[0].isIntersecting,{threshold:.05}).observe(log);
    setInterval(()=>{
      if(!visible || document.hidden)return;
      const [icon,text,cls]=entries[idx++%entries.length], d=document.createElement("div");
      d.className=cls;d.textContent=`[${new Date().toLocaleTimeString("id-ID",{hour12:false})}] ${icon} ${text}`;
      log.appendChild(d);while(log.children.length>7)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
    },2500);
  }

  /* ---------- Mobile flip cards: tap/click/keyboard ---------- */
  $$(".flip-card").forEach(card=>{
    const toggle=()=>card.classList.toggle("flipped");
    card.addEventListener("click",e=>{ if(innerWidth<=767 || coarse){ e.preventDefault(); toggle(); }});
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle()}});
  });

  /* ---------- Placeholder social links: do not navigate to fake URLs ---------- */
  $$("[data-placeholder-link]").forEach(a=>a.addEventListener("click",e=>{
    e.preventDefault();
    alert("Tautan profil belum dikonfigurasi. Ganti href pada index.html dengan URL profil Anda.");
  }));

  /* ---------- Contact form ---------- */
  const form=$("#contactForm"), status=$("#formStatus"), submit=$("#submitBtn");
  form?.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!form.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form).entries());
    if(data.website) return; // honeypot
    const original=submit.innerHTML;
    submit.disabled=true;submit.innerHTML="<span>Memproses…</span>";
    status.textContent="";
    try{
      const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||"Gagal mengirim pesan");
      form.reset();status.textContent="✓ Pesan berhasil diterima.";
    }catch(err){
      // Static-host fallback: preserve a working user flow without falsely claiming DB delivery.
      const mail=`mailto:rizuzamantkj3@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Nama: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
      status.innerHTML="";
      const msg=document.createElement("span");msg.textContent="API kontak belum aktif. ";
      const link=document.createElement("a");link.href=mail;link.textContent="Kirim via email";link.style.color="var(--cyan)";
      status.append(msg,link);
    }finally{submit.disabled=false;submit.innerHTML=original}
  });

  /* ---------- Three.js globe: desktop only, lazy-loaded ---------- */
  const globeEl=$("#globe");
  if(globeEl && innerWidth>=1025 && !reduced){
    const loadGlobe=async()=>{
      try{
        const THREE=await import("https://unpkg.com/three@0.157.0/build/three.module.js");
        const scene=new THREE.Scene();
        const camera=new THREE.PerspectiveCamera(35,globeEl.clientWidth/globeEl.clientHeight,.1,100);
        camera.position.z=3.1;
        const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(globeEl.clientWidth,globeEl.clientHeight);renderer.setClearColor(0,0);
        globeEl.appendChild(renderer.domElement);
        const group=new THREE.Group();scene.add(group);
        const geo=new THREE.SphereGeometry(1,28,20);
        const mat=new THREE.MeshBasicMaterial({color:0x00f0ff,wireframe:true,transparent:true,opacity:.23});
        group.add(new THREE.Mesh(geo,mat));
        const ringMat=new THREE.MeshBasicMaterial({color:0xa855f7,transparent:true,opacity:.28});
        const ring=new THREE.Mesh(new THREE.TorusGeometry(1.22,.008,8,80),ringMat);ring.rotation.x=.9;group.add(ring);
        const pointGeo=new THREE.SphereGeometry(.025,6,6);
        for(let i=0;i<22;i++){
          const phi=Math.acos(1-2*(i+.5)/22),theta=Math.PI*(1+Math.sqrt(5))*i;
          const p=new THREE.Mesh(pointGeo,new THREE.MeshBasicMaterial({color:i%3===0?0xffd700:0x00f0ff}));
          p.position.set(Math.cos(theta)*Math.sin(phi),Math.cos(phi),Math.sin(theta)*Math.sin(phi));group.add(p);
        }
        const ro=new ResizeObserver(()=>{const w=globeEl.clientWidth,h=globeEl.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)});
        ro.observe(globeEl);
        let running=true;
        new IntersectionObserver(es=>running=es[0].isIntersecting,{threshold:.05}).observe(globeEl);
        const animate=()=>{if(running){group.rotation.y+=.0022;ring.rotation.z+=.001;renderer.render(scene,camera)}requestAnimationFrame(animate)};animate();
      }catch(e){
        globeEl.innerHTML='<div style="height:100%;display:grid;place-items:center;color:#4e4e57;font:9px JetBrains Mono,monospace">WEBGL FALLBACK · TELEMETRY READY</div>';
      }
    };
    if("requestIdleCallback" in window) requestIdleCallback(loadGlobe,{timeout:1800}); else setTimeout(loadGlobe,500);
  } else if(globeEl){
    globeEl.innerHTML='<div style="height:100%;display:grid;place-items:center;text-align:center;color:#4e4e57;font:9px JetBrains Mono,monospace">MOBILE FALLBACK<br>3D TELEMETRY DISABLED FOR PERFORMANCE</div>';
  }



  /* ---------- V10 live clock/date ---------- */
  const clockEl = $("#liveClock"), dateEl = $("#liveDate");
  const tickClock = () => {
    const now = new Date();
    const time = new Intl.DateTimeFormat("id-ID", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false, timeZone:"Asia/Jakarta" }).format(now);
    const date = new Intl.DateTimeFormat("id-ID", { weekday:"long", day:"2-digit", month:"long", year:"numeric", timeZone:"Asia/Jakarta" }).format(now);
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
  };
  tickClock(); setInterval(tickClock,1000);

  /* ---------- V10 weather: Open-Meteo, no key required ---------- */
  const weatherValue=$("#weatherValue"), weatherMeta=$("#weatherMeta");
  const weatherCode={0:"Cerah",1:"Cerah berawan",2:"Berawan sebagian",3:"Mendung",45:"Kabut",48:"Kabut beku",51:"Gerimis",53:"Gerimis",55:"Gerimis lebat",61:"Hujan ringan",63:"Hujan",65:"Hujan lebat",71:"Salju ringan",73:"Salju",75:"Salju lebat",80:"Hujan singkat",81:"Hujan",82:"Hujan deras",95:"Badai petir",96:"Badai + es",99:"Badai + es"};
  const loadWeather = async()=>{
    try{
      const c=window.RZ_CONFIG?.weather||{lat:-6.2088,lon:106.8456,city:"Jakarta"};
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FJakarta`;
      const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("weather");
      const d=await r.json(), cur=d.current||{};
      if(weatherValue) weatherValue.textContent=`${Math.round(cur.temperature_2m ?? 0)}°C · ${weatherCode[cur.weather_code]||"Cuaca aktif"}`;
      if(weatherMeta) weatherMeta.textContent=`${c.city} · RH ${Math.round(cur.relative_humidity_2m??0)}% · Angin ${Math.round(cur.wind_speed_10m??0)} km/j`;
    }catch(e){
      if(weatherValue) weatherValue.textContent="Cuaca sementara offline";
      if(weatherMeta) weatherMeta.textContent="Waktu lokal tetap aktif · UTC+7";
    }
  };
  loadWeather(); setInterval(loadWeather,10*60*1000);

  /* ---------- V13 hanging arachnid + cyber parallel layer ---------- */
  const arachnidCanvas = $("#hangingArachnidCanvas");
  if (arachnidCanvas && !reduced) {
    const ctx = arachnidCanvas.getContext("2d", { alpha:true });
    let W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2),t=0,raf;
    const nodes=[];
    function resize(){ W=innerWidth; H=innerHeight; dpr=Math.min(devicePixelRatio||1,2); arachnidCanvas.width=W*dpr; arachnidCanvas.height=H*dpr; arachnidCanvas.style.width=W+'px'; arachnidCanvas.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); nodes.length=0; for(let i=0;i<34;i++) nodes.push({x:Math.random()*W,y:Math.random()*H,v:0.08+Math.random()*.18,p:Math.random()*Math.PI*2}); }
    function line(x1,y1,x2,y2,a){ctx.strokeStyle=`rgba(34,211,238,${a})`;ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
    function drawFigure(cx,top,scale,phase){
      const sway=Math.sin(phase)*6, headY=top+34+Math.sin(phase*.8)*2, shoulderY=top+58;
      ctx.save();ctx.translate(cx+sway,0);ctx.lineCap='round';ctx.lineJoin='round';
      // web tether
      ctx.strokeStyle='rgba(220,235,240,.48)';ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,headY-8);ctx.stroke();
      for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(34,211,238,${.10-i*.02})`;ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(i*3-3,0);ctx.lineTo(i*2-2,headY-10);ctx.stroke()}
      // original masked vigilante silhouette
      ctx.fillStyle='rgba(9,13,18,.86)';ctx.strokeStyle='rgba(230,36,41,.55)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(0,headY,12*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
      // mask mesh
      ctx.strokeStyle='rgba(34,211,238,.30)';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(-8*scale,headY-3);ctx.lineTo(8*scale,headY+5);ctx.moveTo(8*scale,headY-3);ctx.lineTo(-8*scale,headY+5);ctx.moveTo(-10*scale,headY);ctx.lineTo(10*scale,headY);ctx.stroke();
      // torso, arms, legs
      ctx.strokeStyle='rgba(220,230,235,.46)';ctx.lineWidth=5*scale;
      ctx.beginPath();ctx.moveTo(-7*scale,shoulderY);ctx.lineTo(-25*scale,shoulderY+34);ctx.lineTo(-42*scale,shoulderY+44);ctx.moveTo(7*scale,shoulderY);ctx.lineTo(25*scale,shoulderY+31);ctx.lineTo(42*scale,shoulderY+40);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,shoulderY);ctx.lineTo(-4*scale,shoulderY+58);ctx.lineTo(-18*scale,shoulderY+94);ctx.moveTo(0,shoulderY);ctx.lineTo(4*scale,shoulderY+58);ctx.lineTo(20*scale,shoulderY+92);ctx.stroke();
      ctx.strokeStyle='rgba(230,36,41,.32)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,shoulderY+8);ctx.lineTo(0,shoulderY+50);ctx.moveTo(-5,shoulderY+24);ctx.lineTo(5,shoulderY+24);ctx.stroke();
      // web strands from wrists
      ctx.strokeStyle='rgba(230,230,235,.28)';ctx.lineWidth=.65;[[ -42,40,-82,16], [42,36,82,12],[-18,94,-52,118],[20,92,54,116]].forEach(a=>{ctx.beginPath();ctx.moveTo(a[0]*scale,a[1]*scale+shoulderY);ctx.lineTo(a[2]*scale,a[3]*scale+shoulderY);ctx.stroke()});
      ctx.restore();
    }
    function frame(){
      t+=.012;ctx.clearRect(0,0,W,H);
      // parallel cyber lanes behind the hanging figure
      ctx.save();ctx.globalAlpha=.28; for(let k=0;k<7;k++){const y=H*(.16+k*.105)+Math.sin(t+k)*10;ctx.beginPath();ctx.strokeStyle=k%2?'rgba(34,211,238,.16)':'rgba(230,36,41,.12)';ctx.lineWidth=.6;ctx.moveTo(W*.48,y);ctx.lineTo(W*.98,y-50);ctx.stroke();}ctx.restore();
      nodes.forEach(n=>{n.p+=n.v*.04; n.y+=n.v; if(n.y>H+10)n.y=-10; ctx.fillStyle=`rgba(34,211,238,${.12+.12*Math.sin(n.p)})`;ctx.fillRect(n.x,n.y,1.3,1.3)});
      // hanging silhouette is intentionally abstract/original to avoid a branded character asset
      drawFigure(W*.82,H*.075,.95,t);
      raf=requestAnimationFrame(frame);
    }
    resize();addEventListener('resize',resize,{passive:true});frame();
  }

  /* ---------- V10 interactive spider/network background ---------- */
  const spiderCanvas=$("#spiderNetworkCanvas");
  if(spiderCanvas && !reduced){
    const ctx=spiderCanvas.getContext("2d",{alpha:true});
    let W=0,H=0,dpr=1,raf=0,running=true,nodes=[];
    const resize=()=>{
      dpr=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;
      spiderCanvas.width=Math.floor(W*dpr);spiderCanvas.height=Math.floor(H*dpr);spiderCanvas.style.width=W+"px";spiderCanvas.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=W<600?18:34; nodes=Array.from({length:count},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.12,r:Math.random()*1.4+.5,phase:Math.random()*Math.PI*2}));
    };
    const draw=(t=0)=>{
      if(!running)return; ctx.clearRect(0,0,W,H);
      // Parallel spider-web geometry centered near the hero portrait on desktop, centered on mobile.
      const cx=W>=768?W*.67:W*.5, cy=W>=768?H*.47:H*.42, base=Math.min(W,H)*.22;
      for(let ring=1;ring<=4;ring++){
        const r=base*ring/2.2; ctx.beginPath();
        for(let i=0;i<=32;i++){const a=(i/32)*Math.PI*2;const wob=Math.sin(a*4+t*.0004+ring)*1.5;const x=cx+Math.cos(a)*(r+wob),y=cy+Math.sin(a)*(r+wob);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
        ctx.closePath();ctx.strokeStyle=ring%2?"rgba(34,211,238,.075)":"rgba(230,36,41,.055)";ctx.lineWidth=.7;ctx.stroke();
      }
      for(let i=0;i<12;i++){
        const a=i/12*Math.PI*2, ex=cx+Math.cos(a)*base*1.82, ey=cy+Math.sin(a)*base*1.82;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.strokeStyle=i%3===0?"rgba(230,36,41,.075)":"rgba(29,78,216,.15)";ctx.stroke();
      }
      nodes.forEach((n,i)=>{
        n.x+=n.vx;n.y+=n.vy;n.phase+=.02;if(n.x<-20)n.x=W+20;if(n.x>W+20)n.x=-20;if(n.y<-20)n.y=H+20;if(n.y>H+20)n.y=-20;
        const near=Math.hypot(n.x-cx,n.y-cy), alpha=near<base*2.1?.28:.14;
        ctx.beginPath();ctx.arc(n.x,n.y,n.r+Math.sin(n.phase)*.35,0,Math.PI*2);ctx.fillStyle=i%5===0?`rgba(230,36,41,${alpha})`:`rgba(34,211,238,${alpha})`;ctx.fill();
        nodes.forEach((m,j)=>{if(j<=i)return;const dx=n.x-m.x,dy=n.y-m.y,dist=Math.hypot(dx,dy);if(dist<130){ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.strokeStyle=`rgba(34,211,238,${(1-dist/130)*.045})`;ctx.lineWidth=.55;ctx.stroke()}});
      });
      raf=requestAnimationFrame(draw);
    };
    resize();addEventListener("resize",resize,{passive:true});document.addEventListener("visibilitychange",()=>{running=!document.hidden;if(running)raf=requestAnimationFrame(draw)});raf=requestAnimationFrame(draw);
  }

  /* ---------- V10 3D profile parallax — pointer/touch safe ---------- */
  const profileStage=$(".profile-stage"), spiderFrame=$(".spider-frame");
  if(profileStage && spiderFrame && !reduced && !coarse){
    let tx=0,ty=0,rx=0,ry=0;
    profileStage.addEventListener("pointermove",e=>{
      const r=profileStage.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;tx=nx*7;ty=ny*6;
    },{passive:true});
    profileStage.addEventListener("pointerleave",()=>{tx=0;ty=0},{passive:true});
    const loop=()=>{rx+=(tx-rx)*.08;ry+=(ty-ry)*.08;spiderFrame.style.transform=`rotateY(${rx}deg) rotateX(${-ry}deg)`;requestAnimationFrame(loop)};loop();
  }

  /* ---------- V10 global threat pulse map ---------- */
  const threatMap=$("#threatMapCanvas"), threatBadge=$("#threatLiveBadge"), threatSource=$("#threatSourceText"), iocCount=$("#iocCount"), malwareCount=$("#malwareCount"), sourceAge=$("#sourceAge"), threatCount=$("#threatCount"), threatList=$("#threatFeedList");
  const threatDemo=["TLS anomaly observed","Credential spray monitored","Botnet IOC indexed","Phishing infrastructure tagged","WAF policy synchronized","Malware family correlation updated"];
  const renderThreatFeed=(items,live)=>{
    if(!threatList)return;
    threatList.textContent="";
    const rows=(items&&items.length?items.slice(0,5).map(x=>`${x.malware||"Threat IOC"} · ${x.iocType||x.type||"indicator"}`):threatDemo);
    rows.forEach((text,i)=>{const row=document.createElement("div");row.className="feed-line";const dot=document.createElement("i");const span=document.createElement("span");span.textContent=text;row.append(dot,span);threatList.appendChild(row)});
    if(threatBadge){threatBadge.innerHTML="";const dot=document.createElement("span");dot.className="status-dot";const label=document.createElement("span");label.textContent=live?"LIVE THREATFOX":"DEMO TELEMETRY";threatBadge.append(dot,label)}
  };
  const loadThreats=async()=>{
    if(!threatMap)return;
    try{
      const endpoint=window.RZ_CONFIG?.threatApi||"/api/threats";const r=await fetch(endpoint,{cache:"no-store"});if(!r.ok)throw new Error("threat");const d=await r.json();
      if(d.live){
        if(iocCount)iocCount.textContent=String(d.count??0);if(malwareCount)malwareCount.textContent=String(d.families??0);if(sourceAge)sourceAge.textContent="< 24h";if(threatCount)threatCount.textContent="LIVE";if(threatSource)threatSource.textContent="Verified threat-intelligence telemetry dari ThreatFox; visual map menunjukkan pulse volume, bukan lokasi serangan presisi.";renderThreatFeed(d.data,true);return;
      }
      throw new Error("demo");
    }catch(e){
      if(iocCount)iocCount.textContent="SIM";if(malwareCount)malwareCount.textContent="LIVE UI";if(sourceAge)sourceAge.textContent="NOW";if(threatCount)threatCount.textContent="DEMO";if(threatSource)threatSource.textContent="Mode DEMO: animasi telemetry untuk presentasi UI. Aktifkan THREATFOX_AUTH_KEY di Vercel untuk feed terverifikasi.";renderThreatFeed([],false);
    }
  };
  loadThreats();setInterval(loadThreats,5*60*1000);

  if(threatMap && !reduced){
    const ctx=threatMap.getContext("2d",{alpha:true});let W=0,H=0,dpr=1,raf=0,points=[];
    const hubs=[{x:.18,y:.43,c:"red"},{x:.37,y:.34,c:"cyan"},{x:.51,y:.29,c:"cyan"},{x:.67,y:.39,c:"red"},{x:.82,y:.50,c:"cyan"},{x:.71,y:.70,c:"amber"},{x:.44,y:.68,c:"green"}];
    const resize=()=>{const r=threatMap.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.5);W=r.width;H=r.height;threatMap.width=Math.floor(W*dpr);threatMap.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);points=hubs.map((p,i)=>({...p,phase:i*.8}))};
    const color=p=>p.c==="red"?"230,36,41":p.c==="amber"?"245,158,11":p.c==="green"?"16,185,129":"34,211,238";
    const draw=(t=0)=>{const parent=threatMap.parentElement;if(!parent)return;ctx.clearRect(0,0,W,H);ctx.strokeStyle="rgba(255,255,255,.045)";ctx.lineWidth=.5;for(let x=0;x<W;x+=W/12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=H/6){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      points.forEach((p,i)=>{const x=p.x*W,y=p.y*H;p.phase+=.018;const pulse=(Math.sin(p.phase+t*.001)+1)/2;ctx.beginPath();ctx.arc(x,y,3+pulse*3,0,Math.PI*2);ctx.fillStyle=`rgba(${color(p)},${.22+pulse*.2})`;ctx.fill();ctx.beginPath();ctx.arc(x,y,8+pulse*10,0,Math.PI*2);ctx.strokeStyle=`rgba(${color(p)},${.05+pulse*.05})`;ctx.stroke();});
      points.forEach((a,i)=>points.forEach((b,j)=>{if(j<=i)return;const ax=a.x*W,ay=a.y*H,bx=b.x*W,by=b.y*H;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.strokeStyle="rgba(29,78,216,.15)";ctx.stroke()}));
      raf=requestAnimationFrame(draw)};
    resize();addEventListener("resize",resize,{passive:true});new IntersectionObserver(es=>{if(es[0].isIntersecting){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)}},{threshold:.05}).observe(threatMap);raf=requestAnimationFrame(draw);
  }


  /* ---------- V12 cyberpunk-inspired text telemetry ---------- */
  const cyberWords=[...document.querySelectorAll('.cyber-word')];
  const cyberEyebrow=document.querySelector('.cyber-eyebrow');
  const cyberReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!cyberReduced){
    let glitchTimer;
    const microGlitch=()=>{
      cyberWords.forEach((el,i)=>{
        el.style.setProperty('--glitch-seed',String(Math.random()));
        el.classList.remove('micro-glitch');
        void el.offsetWidth;
        if(Math.random()<.72) el.classList.add('micro-glitch');
        setTimeout(()=>el.classList.remove('micro-glitch'),260+i*35);
      });
      if(cyberEyebrow){
        cyberEyebrow.classList.remove('cyber-flicker');
        void cyberEyebrow.offsetWidth;
        cyberEyebrow.classList.add('cyber-flicker');
      }
      glitchTimer=setTimeout(microGlitch,4200+Math.random()*3600);
    };
    glitchTimer=setTimeout(microGlitch,1800);
    window.addEventListener('pagehide',()=>clearTimeout(glitchTimer),{once:true});
  }

  console.log("%cRizu Zaman — Portfolio v12","color:#8BEAF5;font-weight:700");
})();

/* =========================================================
   V14.2 — LIGHT 3D MICRO-PARALLAX / MOBILE-SAFE ENHANCEMENT
   Additive: desktop pointer only, disabled for coarse pointers and reduced motion.
   ========================================================= */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse || window.innerWidth < 1025) return;
  const stage = document.querySelector('.profile-stage');
  if (!stage) return;
  let raf = 0, tx = 0, ty = 0;
  const paint = () => {
    raf = 0;
    stage.style.transform = `perspective(1100px) rotateX(${ty}deg) rotateY(${tx}deg)`;
  };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 4.2;
    ty = -((e.clientY - r.top) / r.height - .5) * 3.2;
    if (!raf) raf = requestAnimationFrame(paint);
  }, {passive:true});
  stage.addEventListener('pointerleave', () => {
    tx = ty = 0;
    if (!raf) raf = requestAnimationFrame(paint);
  }, {passive:true});
})();

/* Dense UI cards get a tiny tilt only on precise pointer devices. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse || window.innerWidth < 1100) return;
  const cards = document.querySelectorAll('.dossier-card,.info-card,.skill-group,.achievement');
  cards.forEach(card => {
    let raf = 0, rx = 0, ry = 0;
    const draw = () => { raf = 0; card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`; };
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      ry = ((e.clientX-r.left)/r.width-.5)*1.8;
      rx = -((e.clientY-r.top)/r.height-.5)*1.8;
      if (!raf) raf = requestAnimationFrame(draw);
    }, {passive:true});
    card.addEventListener('pointerleave', () => {rx=ry=0;if(!raf)raf=requestAnimationFrame(draw)}, {passive:true});
  });
})();
