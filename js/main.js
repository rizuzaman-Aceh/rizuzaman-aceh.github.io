/* ============================================================
   RIZU ZAMAN — CYBER LUXURY INTERACTION ENGINE
============================================================ */

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isTouch =
  window.matchMedia("(pointer: coarse)").matches;


/* ============================================================
   UTILITIES
============================================================ */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];


/* ============================================================
   YEAR
============================================================ */

$("#year").textContent =
  new Date().getFullYear();


/* ============================================================
   MOBILE NAVIGATION
============================================================ */

const menuToggle = $("#menu-toggle");
const navLinks = $("#nav-links");

if (menuToggle && navLinks) {

  menuToggle.addEventListener("click", () => {

    const isOpen =
      navLinks.classList.toggle("open");

    menuToggle.classList.toggle(
      "open",
      isOpen
    );

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  });

  $$(".nav-link", navLinks).forEach(link => {

    link.addEventListener("click", () => {

      navLinks.classList.remove("open");
      menuToggle.classList.remove("open");

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}


/* ============================================================
   SCROLL PROGRESS
============================================================ */

const scrollProgress =
  $("#scroll-progress");

function updateScrollProgress() {

  const scrollTop =
    window.scrollY;

  const documentHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    documentHeight > 0
      ? (scrollTop / documentHeight) * 100
      : 0;

  scrollProgress.style.width =
    `${progress}%`;
}

window.addEventListener(
  "scroll",
  updateScrollProgress,
  { passive: true }
);

updateScrollProgress();


/* ============================================================
   SCROLL SPY
============================================================ */

const sections =
  $$("main section[id]");

const navItems =
  $$(".nav-link");

const sectionObserver =
  new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        if (!entry.isIntersecting)
          return;

        navItems.forEach(link => {

          link.classList.toggle(
            "active",
            link.getAttribute("href") ===
            `#${entry.target.id}`
          );

        });

      });

    },
    {
      rootMargin:
        "-35% 0px -55% 0px"
    }
  );

sections.forEach(section =>
  sectionObserver.observe(section)
);


/* ============================================================
   REVEAL ANIMATIONS
============================================================ */

const revealElements =
  $$(".reveal");

if (!prefersReducedMotion) {

  const revealObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting)
            return;

          const siblings =
            [...entry.target.parentElement.children];

          const index =
            siblings.indexOf(entry.target);

          entry.target.style.transitionDelay =
            `${Math.min(index * 60, 300)}ms`;

          entry.target.classList.add(
            "visible"
          );

          revealObserver.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: .12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

  revealElements.forEach(element =>
    revealObserver.observe(element)
  );

} else {

  revealElements.forEach(element =>
    element.classList.add("visible")
  );

}


/* ============================================================
   TERMINAL TYPING
============================================================ */

const terminal =
  $("#terminal-output");

const terminalLines = [
  "$ whoami",
  "rizuzaman@engineer",
  "$ security --status",
  "[OK] all systems operational",
  "$ deploy --production",
  "[OK] deployment verified"
];

let terminalLineIndex = 0;
let terminalCharIndex = 0;

async function typeTerminal() {

  if (!terminal)
    return;

  terminal.innerHTML = "";

  for (
    let lineIndex = 0;
    lineIndex < terminalLines.length;
    lineIndex++
  ) {

    const line =
      terminalLines[lineIndex];

    const element =
      document.createElement("div");

    terminal.appendChild(element);

    for (
      let charIndex = 0;
      charIndex < line.length;
      charIndex++
    ) {

      element.textContent =
        line.slice(0, charIndex + 1);

      await delay(
        prefersReducedMotion ? 0 : 18
      );

    }

    await delay(
      prefersReducedMotion ? 0 : 260
    );
  }

  const cursor =
    document.createElement("span");

  cursor.className =
    "terminal-cursor";

  terminal.appendChild(cursor);

  await delay(
    prefersReducedMotion ? 300 : 2400
  );

  typeTerminal();
}

function delay(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

typeTerminal();


/* ============================================================
   MATRIX RAIN
============================================================ */

const matrixCanvas =
  $("#matrix-canvas");

const matrixContext =
  matrixCanvas?.getContext("2d");

let matrixAnimation;

function setupMatrix() {

  if (
    !matrixCanvas ||
    !matrixContext ||
    prefersReducedMotion
  ) {
    return;
  }

  const density =
    window.innerWidth < 768
      ? 34
      : 22;

  const fontSize = 11;

  let columns = 0;
  let drops = [];

  function resize() {

    const ratio =
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      );

    matrixCanvas.width =
      window.innerWidth * ratio;

    matrixCanvas.height =
      window.innerHeight * ratio;

    matrixCanvas.style.width =
      `${window.innerWidth}px`;

    matrixCanvas.style.height =
      `${window.innerHeight}px`;

    matrixContext.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

    columns =
      Math.floor(
        window.innerWidth / density
      );

    drops =
      Array.from(
        { length: columns },
        () =>
          Math.random() *
          window.innerHeight /
          fontSize
      );
  }

  const chars =
    "01アカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function draw() {

    matrixContext.fillStyle =
      "rgba(10,10,10,.065)";

    matrixContext.fillRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    matrixContext.font =
      `${fontSize}px JetBrains Mono`;

    matrixContext.fillStyle =
      "rgba(0,255,65,.5)";

    drops.forEach(
      (y, index) => {

        const text =
          chars[
            Math.floor(
              Math.random() *
              chars.length
            )
          ];

        const x =
          index * density;

        matrixContext.fillText(
          text,
          x,
          y * fontSize
        );

        if (
          y * fontSize >
            window.innerHeight &&
          Math.random() > .975
        ) {
          drops[index] = 0;
        }

        drops[index]++;
      }
    );

    matrixAnimation =
      requestAnimationFrame(draw);
  }

  resize();

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );

  draw();
}

setupMatrix();


/* ============================================================
   TRAFFIC GRAPH
============================================================ */

const trafficCanvas =
  $("#traffic-canvas");

const trafficValue =
  $("#traffic-value");

let trafficAnimation;

function setupTrafficGraph() {

  if (!trafficCanvas)
    return;

  const ctx =
    trafficCanvas.getContext("2d");

  let visible = true;

  const values =
    Array.from(
      { length: 60 },
      () => Math.random()
    );

  function resize() {

    const ratio =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );

    const rect =
      trafficCanvas.getBoundingClientRect();

    trafficCanvas.width =
      rect.width * ratio;

    trafficCanvas.height =
      rect.height * ratio;

    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );
  }

  function draw() {

    if (!visible) {

      trafficAnimation =
        requestAnimationFrame(draw);

      return;
    }

    const width =
      trafficCanvas.clientWidth;

    const height =
      trafficCanvas.clientHeight;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    /* Grid */

    ctx.strokeStyle =
      "rgba(255,255,255,.055)";

    ctx.lineWidth = 1;

    for (
      let y = 0;
      y <= height;
      y += height / 3
    ) {

      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        width,
        y
      );

      ctx.stroke();
    }

    /* Data */

    for (
      let i = 0;
      i < values.length;
      i++
    ) {

      values[i] +=
        (Math.random() - .5) * .18;

      values[i] =
        Math.max(
          .12,
          Math.min(
            .92,
            values[i]
          )
        );
    }

    ctx.beginPath();

    values.forEach(
      (value, index) => {

        const x =
          index *
          (width / (values.length - 1));

        const y =
          height -
          value * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

      }
    );

    ctx.strokeStyle =
      "#00f0ff";

    ctx.lineWidth = 1.5;

    ctx.shadowBlur = 10;
    ctx.shadowColor =
      "rgba(0,240,255,.7)";

    ctx.stroke();

    ctx.shadowBlur = 0;

    const current =
      (
        1.8 +
        values[values.length - 1] * 1.9
      ).toFixed(2);

    if (trafficValue) {
      trafficValue.textContent =
        current;
    }

    trafficAnimation =
      requestAnimationFrame(draw);
  }

  const observer =
    new IntersectionObserver(
      entries => {

        visible =
          entries[0].isIntersecting;

      },
      {
        threshold: 0
      }
    );

  observer.observe(
    trafficCanvas
  );

  resize();

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );

  draw();
}

setupTrafficGraph();


/* ============================================================
   THREAT LEVEL
============================================================ */

const threatLevel =
  $("#threat-level");

const threatMeter =
  $("#threat-meter-bar");

const threatDescription =
  $("#threat-description");

const threatStates = [

  {
    name: "LOW",
    width: "24%",
    color: "#00ff41",
    description:
      "Systems operating within normal parameters."
  },

  {
    name: "MEDIUM",
    width: "56%",
    color: "#ffd700",
    description:
      "Elevated activity detected. Monitoring intensified."
  },

  {
    name: "HIGH",
    width: "82%",
    color: "#ff5b5b",
    description:
      "Suspicious activity detected. Countermeasures active."
  }

];

function updateThreatLevel() {

  if (!threatLevel)
    return;

  const state =
    threatStates[
      Math.floor(
        Math.random() *
        threatStates.length
      )
    ];

  threatLevel.textContent =
    state.name;

  threatLevel.style.color =
    state.color;

  threatMeter.style.width =
    state.width;

  threatMeter.style.background =
    state.color;

  threatMeter.style.boxShadow =
    `0 0 12px ${state.color}`;

  threatDescription.textContent =
    state.description;
}

updateThreatLevel();

if (!prefersReducedMotion) {

  setInterval(
    updateThreatLevel,
    3500
  );

}


/* ============================================================
   SECURITY EVENT LOG
============================================================ */

const securityLog =
  $("#security-log");

const eventTypes = [
  "AUTH",
  "FIREWALL",
  "API",
  "NETWORK",
  "SYSTEM"
];

const eventMessages = [
  "Connection verified",
  "Traffic anomaly scanned",
  "Authentication accepted",
  "Firewall rule evaluated",
  "API request validated",
  "Encrypted session established",
  "Security policy synchronized"
];

function getTime() {

  return new Date()
    .toLocaleTimeString(
      "en-US",
      {
        hour12: false
      }
    );
}

function addSecurityLog() {

  if (!securityLog)
    return;

  const entry =
    document.createElement("div");

  entry.className =
    "log-entry";

  const type =
    eventTypes[
      Math.floor(
        Math.random() *
        eventTypes.length
      )
    ];

  const message =
    eventMessages[
      Math.floor(
        Math.random() *
        eventMessages.length
      )
    ];

  entry.innerHTML = `
    <span class="log-time">${getTime()}</span>
    <span class="log-type">${type}</span>
    <span class="log-message">${message}</span>
  `;

  securityLog.prepend(entry);

  while (
    securityLog.children.length > 7
  ) {
    securityLog.lastElementChild.remove();
  }
}

for (let i = 0; i < 5; i++) {
  addSecurityLog();
}

if (!prefersReducedMotion) {

  setInterval(
    addSecurityLog,
    2300
  );

}


/* ============================================================
   SKILL PROGRESS RINGS
============================================================ */

const ringObserver =
  new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        if (!entry.isIntersecting)
          return;

        const ring =
          entry.target;

        const value =
          Number(
            ring.dataset.value
          );

        ring.style.setProperty(
          "--progress",
          value
        );

        ring.classList.add(
          "active"
        );

        ringObserver.unobserve(
          ring
        );

      });

    },
    {
      threshold: .35
    }
  );

$$(".ring").forEach(ring =>
  ringObserver.observe(ring)
);


/* ============================================================
   3D TILT — DESKTOP
============================================================ */

if (
  !isTouch &&
  !prefersReducedMotion
) {

  $$(".tilt-card").forEach(card => {

    card.addEventListener(
      "pointermove",
      event => {

        if (
          card.classList.contains(
            "flipped"
          )
        ) {
          return;
        }

        const rect =
          card.getBoundingClientRect();

        const x =
          event.clientX -
          rect.left;

        const y =
          event.clientY -
          rect.top;

        const rotateY =
          ((x / rect.width) - .5) * 8;

        const rotateX =
          ((y / rect.height) - .5) * -8;

        card.style.transform =
          `
          perspective(1400px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateY(-3px)
          `;
      }
    );

    card.addEventListener(
      "pointerleave",
      () => {

        card.style.transform =
          "";

      }
    );

  });

}


/* ============================================================
   PROJECT FLIP
============================================================ */

$$(".project-card").forEach(card => {

  const flip =
    () => {

      card.classList.toggle(
        "flipped"
      );

    };

  card.addEventListener(
    "click",
    flip
  );

  card.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        flip();

      }

    }
  );

});


/* ============================================================
   CUSTOM CURSOR
============================================================ */

if (
  !isTouch &&
  !prefersReducedMotion
) {

  const cursor =
    $("#cursor");

  const cursorRing =
    $("#cursor-ring");

  let mouseX = 0;
  let mouseY = 0;

  let ringX = 0;
  let ringY = 0;

  window.addEventListener(
    "pointermove",
    event => {

      mouseX = event.clientX;
      mouseY = event.clientY;

      cursor.style.left =
        `${mouseX}px`;

      cursor.style.top =
        `${mouseY}px`;

    },
    { passive: true }
  );

  function animateCursor() {

    ringX +=
      (mouseX - ringX) * .15;

    ringY +=
      (mouseY - ringY) * .15;

    cursorRing.style.left =
      `${ringX}px`;

    cursorRing.style.top =
      `${ringY}px`;

    requestAnimationFrame(
      animateCursor
    );
  }

  animateCursor();

  $$(
    "a, button, input, textarea, .project-card, .glass-card"
  ).forEach(element => {

    element.addEventListener(
      "mouseenter",
      () => {

        document.body.classList.add(
          "cursor-hover"
        );

      }
    );

    element.addEventListener(
      "mouseleave",
      () => {

        document.body.classList.remove(
          "cursor-hover"
        );

      }
    );

  });

}


/* ============================================================
   CONTACT FORM — SIMULATION
============================================================ */

const contactForm =
  $("#contact-form");

const formStatus =
  $("#form-status");

if (contactForm) {

  contactForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const button =
        $(".submit-button", contactForm);

      button.classList.add(
        "loading"
      );

      formStatus.textContent =
        "TRANSMITTING SECURE MESSAGE...";

      await delay(1500);

      button.classList.remove(
        "loading"
      );

      formStatus.textContent =
        "MESSAGE QUEUED SUCCESSFULLY.";

      contactForm.reset();

      setTimeout(() => {

        formStatus.textContent = "";

      }, 5000);

    }
  );

}


/* ============================================================
   THREE.JS — OPTIONAL DESKTOP GLOBE
   Lightweight decorative WebGL layer.
============================================================ */

async function initThreeGlobe() {

  if (
    prefersReducedMotion ||
    isTouch ||
    window.innerWidth < 1024
  ) {
    return;
  }

  /*
    Globe container is intentionally not injected
    into the primary UI unless needed.

    This keeps the base page fast and avoids
    unnecessary WebGL work on mobile.
  */

  try {

    const THREE =
      await import("three");

    /*
      Lightweight offscreen WebGL verification.
      The main visual system remains CSS/canvas-driven.
    */

    const scene =
      new THREE.Scene();

    const camera =
      new THREE.PerspectiveCamera(
        35,
        1,
        .1,
        100
      );

    camera.position.z = 4;

    const renderer =
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: false
      });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      )
    );

    renderer.setSize(
      1,
      1
    );

    const geometry =
      new THREE.SphereGeometry(
        1,
        20,
        12
      );

    const material =
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: .08
      });

    const globe =
      new THREE.Mesh(
        geometry,
        material
      );

    scene.add(globe);

    function animate() {

      globe.rotation.y += .0015;

      requestAnimationFrame(
        animate
      );

    }

    animate();

    /*
      Renderer is intentionally not attached
      to DOM because this implementation does not
      expose a globe viewport.
    */

  } catch (error) {

    console.info(
      "Three.js optional layer unavailable."
    );

  }

}

initThreeGlobe();


/* ============================================================
   VISIBILITY / PERFORMANCE
============================================================ */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden &&
      matrixAnimation
    ) {

      cancelAnimationFrame(
        matrixAnimation
      );

      matrixAnimation = null;

    } else if (
      !document.hidden &&
      !prefersReducedMotion &&
      matrixCanvas
    ) {

      setupMatrix();

    }

  }
);


/* ============================================================
   FINAL INITIALIZATION
============================================================ */

requestAnimationFrame(() => {

  document.body.classList.add(
    "page-ready"
  );

});
