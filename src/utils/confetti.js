const confetti = (options = {}) => {
  const {
    particleCount = 120,
    spread = 80,
    startVelocity = 40,
    decay = 0.93,
    gravity = 0.8,
    ticks = 250,
    origin = { x: 0.5, y: 0.4 },
    colors = ['#135BEC', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
  } = options;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * spread * 2 - spread) * (Math.PI / 180) - Math.PI / 2;
    const velocity = startVelocity * (0.4 + Math.random() * 0.6);
    particles.push({
      x: origin.x * canvas.width,
      y: origin.y * canvas.height,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      shape: Math.random() > 0.3 ? 'rect' : 'circle',
      life: ticks,
      tick: 0,
    });
  }

  let frame;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      if (p.tick >= p.life) return;
      alive = true;
      p.tick++;
      p.vx *= decay;
      p.vy *= decay;
      p.vy += gravity * 0.4;
      p.x += p.vx + Math.sin(p.tick * p.wobbleSpeed) * p.wobble * 0.05;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      const progress = p.tick / p.life;
      const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (alive) {
      frame = requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', handleResize);
    canvas.remove();
  };

  animate();

  return cleanup;
};

export default confetti;
