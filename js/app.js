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
      el.addEventListener("mouseenter", () => { if(dot) dot.style.width="13px"; if(dot) dot.style.height="13px"; if(ring){ring.style.width="42px";ring.style.height="42px";ring.style.borderColor="rgba(0,240,255,.45)";} });
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
        ctx.fillStyle = Math.random()>.96 ? "rgba(168,85,247,.28)" : "rgba(0,240,255,.20)";
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
    ["initializing secure shell...", "normal"],
    ["authenticating via ed25519 key...", "normal"],
    ["✓ access granted (2FA verified)", "ok"],
    ["mounting distributed filesystem...", "normal"],
    ["✓ 42 nodes connected", "ok"],
    ["system ready. welcome, rizu.", "gold"]
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
      else timer=setTimeout(type, reduced?8:18);
    };
    type();
  }

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
      ctx.strokeStyle="rgba(0,240,255,.65)";ctx.lineWidth=1.2;ctx.shadowBlur=7;ctx.shadowColor="rgba(0,240,255,.3)";ctx.stroke();ctx.shadowBlur=0;
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
      const mail=`mailto:hello@rizuzaman.dev?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Nama: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
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

  console.log("%cRizu Zaman — Portfolio v7.0","color:#00f0ff;font-weight:700");
})();
