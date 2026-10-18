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

  const animationBaseDurations = new WeakMap();
  speedInput?.addEventListener("input", () => {
    speed = Number(speedInput.value);
    document.getElementById("speed-value").textContent = speed.toFixed(1) + "×";
    root.style.setProperty("--speed", (1 / speed) + "s");
    document.querySelectorAll(".cube,.orbit,.energy-ring,.prism,.portal-rim,.preview-orbit").forEach(el => {
      if (!animationBaseDurations.has(el)) {
        animationBaseDurations.set(el, parseFloat(getComputedStyle(el).animationDuration) || 1);
      }
      el.style.animationDuration = (animationBaseDurations.get(el) / speed) + "s";
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

  // Interactive Playground: editable text, shapes, image filters, and CSS export.
  const playground = document.getElementById("playground-stage");
  const shape = document.getElementById("editable-shape");
  const textPreview = document.getElementById("editable-text");
  const textInput = document.getElementById("edit-text");
  const shapeSelect = document.getElementById("edit-shape");
  const effectSelect = document.getElementById("edit-effect");
  const editColor = document.getElementById("edit-color");
  const editSize = document.getElementById("edit-size");
  const editRotation = document.getElementById("edit-rotation");
  const editGlow = document.getElementById("edit-glow");
  const imageUpload = document.getElementById("image-upload");
  const imageZoom = document.getElementById("image-zoom");
  const imageSaturate = document.getElementById("image-saturate");
  const cssOutput = document.getElementById("generated-css");
  let uploadedImage = null;

  function playgroundSettings() {
    return {
      text: textInput?.value || "TU TEXTO",
      shape: shapeSelect?.value || "cube",
      effect: effectSelect?.value || "neon",
      color: editColor?.value || "#55f6ff",
      size: Number(editSize?.value || 24),
      rotation: Number(editRotation?.value || 1),
      glow: Number(editGlow?.value || 70),
      zoom: Number(imageZoom?.value || 100),
      saturate: Number(imageSaturate?.value || 120)
    };
  }

  function updatePlayground() {
    if (!shape || !textPreview) return;
    const s = playgroundSettings();
    textPreview.textContent = s.text.trim() || "TU TEXTO";
    shape.classList.remove("shape-cube", "shape-card", "shape-sphere", "shape-diamond",
      "effect-neon", "effect-gradient", "effect-glitch", "effect-plain");
    shape.classList.add("shape-" + s.shape, "effect-" + s.effect);
    shape.style.setProperty("--edit-color", s.color);
    shape.style.setProperty("--edit-size", s.size + "px");
    shape.style.setProperty("--rotation-speed", String(Math.max(.25, s.rotation || .25)));
    shape.style.animationDuration = s.rotation === 0 ? "0s" : (9 / s.rotation) + "s";
    shape.style.boxShadow = "0 0 " + Math.round(s.glow * .55) + "px " + s.color + ", inset 0 0 " + Math.round(s.glow * .35) + "px " + s.color + "44";
    shape.style.borderColor = s.color;
    shape.style.color = s.color;
    document.getElementById("edit-size-value").textContent = s.size + " px";
    document.getElementById("edit-rotation-value").textContent = s.rotation + "×";
    document.getElementById("edit-glow-value").textContent = s.glow + "%";
    let image = document.getElementById("editable-image");
    if (uploadedImage && !image) {
      image = document.createElement("img");
      image.id = "editable-image";
      image.alt = "Imagen cargada para previsualizar efectos";
      playground?.appendChild(image);
    }
    if (image) {
      image.hidden = !uploadedImage;
      if (uploadedImage) image.src = uploadedImage;
      image.style.transform = "scale(" + (s.zoom / 100) + ")";
      image.style.filter = "saturate(" + (s.saturate / 100) + ") drop-shadow(0 0 " + Math.round(s.glow / 5) + "px " + s.color + ")";
    }
    const animation = s.rotation === 0 ? "none" : "playground-spin " + (9 / s.rotation).toFixed(2) + "s linear infinite";
    const textStyle = s.effect === "gradient"
      ? "background:linear-gradient(90deg," + s.color + ",#bb86fc,#ff79c6);-webkit-background-clip:text;background-clip:text;color:transparent;"
      : s.effect === "glitch"
        ? "text-shadow:2px 0 #ff3da7,-2px 0 #37f6ff,0 0 16px currentColor;"
        : s.effect === "plain" ? "text-shadow:none;" : "text-shadow:0 0 12px currentColor;";
    const radius = s.shape === "sphere" ? "50%" : s.shape === "card" ? "18px" : "4px";
    cssOutput.textContent = ".mi-diseno {\n" +
      "  width: " + (s.shape === "card" ? "230px" : s.shape === "diamond" ? "150px" : "190px") + ";\n" +
      "  height: " + (s.shape === "card" ? "150px" : s.shape === "diamond" ? "150px" : "190px") + ";\n" +
      "  display: grid; place-items: center;\n" +
      "  color: " + s.color + ";\n" +
      "  font-size: " + s.size + "px;\n" +
      "  border: 1px solid " + s.color + ";\n" +
      "  border-radius: " + radius + ";\n" +
      "  box-shadow: 0 0 " + Math.round(s.glow * .55) + "px " + s.color + ";\n" +
      "  transform-style: preserve-3d;\n" +
      "  animation: " + animation + ";\n" +
      "  " + textStyle + "\n}";
    if (s.shape === "diamond") cssOutput.textContent += "\n/* Para un diamante, añade: transform: rotate(45deg); */";
  }

  [textInput, shapeSelect, effectSelect, editColor, editSize, editRotation, editGlow, imageZoom, imageSaturate]
    .filter(Boolean).forEach(control => control.addEventListener("input", updatePlayground));
  imageUpload?.addEventListener("change", () => {
    const file = imageUpload.files && imageUpload.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      document.getElementById("copy-status").textContent = "Elige un archivo de imagen válido.";
      return;
    }
    if (uploadedImage && uploadedImage.startsWith("blob:")) URL.revokeObjectURL(uploadedImage);
    uploadedImage = URL.createObjectURL(file);
    playground?.classList.add("has-image");
    updatePlayground();
    document.getElementById("copy-status").textContent = "Imagen cargada. Los efectos se aplican en la vista previa.";
  });
  document.getElementById("copy-css")?.addEventListener("click", async () => {
    const css = cssOutput?.textContent || "";
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(css);
      status.textContent = "¡CSS copiado! Ya puedes pegarlo en tu proyecto.";
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = css;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      status.textContent = copied ? "¡CSS copiado! Ya puedes pegarlo en tu proyecto." : "Selecciona y copia el código que aparece arriba.";
    }
  });
  document.getElementById("play-reset")?.addEventListener("click", () => {
    textInput.value = "TU TEXTO";
    shapeSelect.value = "cube";
    effectSelect.value = "neon";
    editColor.value = "#55f6ff";
    editSize.value = "24";
    editRotation.value = "1";
    editGlow.value = "70";
    imageZoom.value = "100";
    imageSaturate.value = "120";
    imageUpload.value = "";
    if (uploadedImage && uploadedImage.startsWith("blob:")) URL.revokeObjectURL(uploadedImage);
    uploadedImage = null;
    playground?.classList.remove("has-image");
    const image = document.getElementById("editable-image");
    if (image) image.remove();
    updatePlayground();
    document.getElementById("copy-status").textContent = "Valores reiniciados. ¡Crea algo nuevo!";
  });
  document.getElementById("play-download")?.addEventListener("click", () => {
    const s = playgroundSettings();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><defs><radialGradient id="bg"><stop stop-color="' + s.color + '" stop-opacity=".22"/><stop offset="1" stop-color="#090914"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="900" height="600" fill="#090914"/><rect width="900" height="600" fill="url(#bg)"/><g fill="none" stroke="' + s.color + '" stroke-opacity=".22">' + Array.from({length:19},(_,i)=>'<path d="M0 ' + (i*34) + 'H900"/>').join("") + Array.from({length:28},(_,i)=>'<path d="M' + (i*34) + ' 0V600"/>').join("") + '</g><text x="450" y="310" text-anchor="middle" font-family="Arial,sans-serif" font-size="' + Math.min(s.size*2,100) + '" font-weight="bold" fill="' + s.color + '" filter="url(#glow)">' + s.text.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])) + '</text><text x="450" y="555" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#8888aa">EFECTO 3D · MI CREACIÓN</text></svg>';
    const url = URL.createObjectURL(new Blob([svg], {type:"image/svg+xml;charset=utf-8"}));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mi-diseno-efecto-3d.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    document.getElementById("copy-status").textContent = "Tu diseño SVG se está guardando.";
  });
  updatePlayground();

  resizeCanvas();
  if (!reducedMotion) restartParticles();
  else drawParticles();
  window.addEventListener("resize", resizeCanvas, { passive: true });
})();