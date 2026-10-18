(() => {
  "use strict";
  const root = document.documentElement;
  const body = document.body;
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas?.getContext("2d", { alpha: true });
  const colorButtons = [...document.querySelectorAll(".color-dot")];
  const styleButtons = [...document.querySelectorAll(".style-option")];
  const cards = [...document.querySelectorAll(".effect-card")];
  const speedInput = document.getElementById("speed-control");
  const intensityInput = document.getElementById("intensity-control");
  let accent = "#55f6ff";
  let particles = [];
  let width = 0, height = 0, frame = 0, paused = false;
  let speed = 1, intensity = 0.75;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hexToRgb = (hex) => {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map(c => c + c).join("") : value;
    const number = parseInt(full, 16);
    return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
  };
  const setAccent = (hex, name) => {
    accent = hex;
    const [r, g, b] = hexToRgb(hex);
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-rgb", `${r},${g},${b}`);
    document.getElementById("color-name").textContent = name;
    colorButtons.forEach(button => button.classList.toggle("active", button.dataset.color === hex));
    document.querySelectorAll(".ambient-b").forEach(el => el.style.background = hex);
    createParticles();
  };

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function createParticles() {
    if (!width || !height) return;
    const count = Math.min(95, Math.max(28, Math.floor(width / 14)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.55 + 0.12
    }));
  }

  function drawParticles() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const [r, g, b] = hexToRgb(accent);
    const connectionDistance = width < 650 ? 85 : 125;
    particles.forEach((p, i) => {
      if (!paused && !reducedMotion) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * intensity})`;
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - distance / connectionDistance) * 0.14 * intensity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    });
    if (!paused && !reducedMotion) frame = requestAnimationFrame(drawParticles);
  }

  function restartParticles() {
    if (frame) cancelAnimationFrame(frame);
    drawParticles();
  }

  colorButtons.forEach(button => button.addEventListener("click", () => {
    setAccent(button.dataset.color, button.dataset.name);
    restartParticles();
  }));

  speedInput?.addEventListener("input", () => {
    speed = Number(speedInput.value);
    document.getElementById("speed-value").textContent = speed.toFixed(1) + "×";
    root.style.setProperty("--speed", (1 / speed) + "s");
    document.querySelectorAll(".cube,.orbit,.energy-ring,.prism,.portal-rim,.preview-orbit").forEach(el => {
      el.style.animationDuration = (parseFloat(getComputedStyle(el).animationDuration) / speed) + "s";
    });
  });

  intensityInput?.addEventListener("input", () => {
    intensity = Number(intensityInput.value) / 100;
    document.getElementById("intensity-value").textContent = intensityInput.value + "%";
    root.style.setProperty("--glow", intensity);
    restartParticles();
  });

  styleButtons.forEach(button => button.addEventListener("click", () => {
    styleButtons.forEach(item => item.classList.toggle("active", item === button));
    const preview = document.getElementById("lab-preview");
    preview.dataset.style = button.dataset.style;
    const names = { cyber: "NEON CYBER", orbit: "ORBIT MODE", pulse: "PLASMA PULSE" };
    document.getElementById("preview-style-name").textContent = names[button.dataset.style] || "NEON CYBER";
  }));

  document.getElementById("randomize-btn")?.addEventListener("click", () => {
    const choice = colorButtons[Math.floor(Math.random() * colorButtons.length)];
    setAccent(choice.dataset.color, choice.dataset.name);
    speedInput.value = (0.5 + Math.random() * 1.9).toFixed(1);
    speedInput.dispatchEvent(new Event("input"));
    intensityInput.value = String(Math.round((0.3 + Math.random() * 0.7) * 100 / 5) * 5);
    intensityInput.dispatchEvent(new Event("input"));
    const style = styleButtons[Math.floor(Math.random() * styleButtons.length)];
    style.click();
    restartParticles();
  });

  document.getElementById("reset-btn")?.addEventListener("click", () => {
    setAccent("#55f6ff", "Cian eléctrico");
    speedInput.value = "1";
    speedInput.dispatchEvent(new Event("input"));
    intensityInput.value = "75";
    intensityInput.dispatchEvent(new Event("input"));
    styleButtons.find(button => button.dataset.style === "cyber")?.click();
    restartParticles();
  });

  cards.forEach(card => {
    card.addEventListener("pointermove", event => {
      if (window.matchMedia("(hover: none)").matches || paused) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-3px)`;
      card.style.setProperty("--pointer-x", (x * 100) + "%");
      card.style.setProperty("--pointer-y", (y * 100) + "%");
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  const motionToggle = document.getElementById("motion-toggle");
  motionToggle?.addEventListener("click", () => {
    paused = !paused;
    body.classList.toggle("motion-paused", paused);
    motionToggle.setAttribute("aria-pressed", String(paused));
    document.getElementById("motion-label").textContent = paused ? "EFECTOS PAUSADOS" : "EFECTOS ACTIVOS";
    motionToggle.querySelector(".status-dot").style.background = paused ? "#ffb454" : "#63ff9e";
    if (paused) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      drawParticles();
    } else {
      restartParticles();
    }
  });

  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.querySelector(".nav-links");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "×" : "☰";
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    if (menuToggle) menuToggle.textContent = "☰";
  }));

  const backTop = document.getElementById("back-top");
  window.addEventListener("scroll", () => backTop?.classList.toggle("visible", window.scrollY > 450), { passive: true });
  backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
  document.getElementById("year").textContent = new Date().getFullYear();

  let pointerTimer;
  window.addEventListener("pointermove", event => {
    if (window.matchMedia("(hover: none)").matches) return;
    clearTimeout(pointerTimer);
    root.style.setProperty("--pointer-page-x", event.clientX + "px");
    root.style.setProperty("--pointer-page-y", event.clientY + "px");
  }, { passive: true });

  resizeCanvas();
  if (!reducedMotion) restartParticles();
  else drawParticles();
  window.addEventListener("resize", resizeCanvas, { passive: true });
})();