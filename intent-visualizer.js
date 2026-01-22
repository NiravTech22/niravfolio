
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('arch-canvas').parentNode;
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // 1. Create Canvas (Background)
    const canvas = document.createElement('canvas');
    canvas.id = 'intent-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.background = 'radial-gradient(circle at 50% 120%, rgba(var(--accent-rgb), 0.05), transparent 80%)';
    container.appendChild(canvas);

    // 2. Create HUD Overlay (Foreground)
    const hud = document.createElement('div');
    hud.className = 'me-hud';
    hud.style.position = 'absolute';
    hud.style.inset = '0';
    hud.style.zIndex = '10';
    hud.style.display = 'flex';
    hud.style.flexDirection = 'column';
    hud.style.justifyContent = 'center';
    hud.style.alignItems = 'flex-start';
    hud.style.padding = '3rem';
    hud.style.pointerEvents = 'none'; // Let mouse pass through to canvas for interaction where layout permits

    // HUD Content
    // We'll use a glass card effect for the content
    const contentHTML = `
        <style>
            .me-hud-card {
                pointer-events: auto;
                background: rgba(20, 20, 20, 0.4);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 2rem;
                max-width: 450px;
                transform: translateY(20px);
                opacity: 0;
                animation: hudFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            }
            body.light-mode .me-hud-card {
                background: rgba(255, 255, 255, 0.6);
                border-color: rgba(0, 0, 0, 0.05);
            }
            
            .me-label {
                font-family: 'Space Mono', monospace;
                font-size: 0.75rem;
                color: var(--accent);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 1rem;
                display: block;
            }
            
            .me-interests {
                display: flex;
                flex-wrap: wrap;
                gap: 0.6rem;
                margin-bottom: 2rem;
            }
            
            .interest-tag {
                font-family: 'Geist', sans-serif;
                font-size: 0.85rem;
                color: var(--text);
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            body.light-mode .interest-tag {
                background: rgba(0, 0, 0, 0.03);
                border-color: rgba(0, 0, 0, 0.1);
            }
            
            .interest-tag:hover {
                background: rgba(var(--accent-rgb), 0.15);
                border-color: var(--accent);
                transform: translateY(-2px);
            }
            
            .latest-project {
                display: flex;
                align-items: center;
                gap: 1rem;
                border-top: 1px solid var(--card-border);
                padding-top: 1rem;
                width: 100%;
            }
            
            .project-link {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                text-decoration: none;
                color: var(--text);
                font-weight: 500;
                font-size: 0.95rem;
                transition: color 0.2s;
            }
            
            .project-link:hover {
                color: var(--accent);
            }
            
            .project-link i {
                font-size: 1.1rem;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 8px #10b981;
                animation: pulse 2s infinite;
            }

            @keyframes hudFadeUp {
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pulse {
                0% { opacity: 0.5; transform: scale(0.9); }
                50% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 0.5; transform: scale(0.9); }
            }

            @media (max-width: 768px) {
                .me-hud { padding: 1.5rem !important; }
                .me-hud-card { padding: 1.5rem; width: 100%; max-width: 100%; }
                .me-interests { gap: 0.5rem; }
                .interest-tag { font-size: 0.75rem; padding: 0.3rem 0.6rem; }
            }
        </style>
        
        <div class="me-hud-card">
            <span class="me-label">Core Interests</span>
            <div class="me-interests">
                <span class="interest-tag">Robotics</span>
                <span class="interest-tag">Machine Learning</span>
                <span class="interest-tag">GPU Computing</span>
                <span class="interest-tag">Computer Science</span>
                <span class="interest-tag">AR/VR</span>
                <span class="interest-tag">Comp Arch</span>
            </div>
            
            <div class="latest-project">
                <div class="status-dot"></div>
                <div style="flex:1">
                    <span style="font-size: 0.75rem; color: var(--muted); display:block; margin-bottom:2px;">Latest Project</span>
                    <a href="#projects" class="project-link">
                        <i class="fab fa-github"></i>
                        StudentIO
                        <i class="fas fa-arrow-right" style="font-size: 0.8em; opacity: 0.7;"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    hud.innerHTML = contentHTML;
    container.appendChild(hud);

    // 3. Setup Canvas Logic (The "Silky" Background)
    const ctx = canvas.getContext('2d');
    let width, height;
    function resize() {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    window.addEventListener('resize', resize);
    resize();

    // Theme Colors
    function getThemeColor(varName, opacity = 1) {
        const style = getComputedStyle(document.body);
        const rgb = style.getPropertyValue(varName).trim();
        if (!rgb) return `rgba(255, 255, 255, ${opacity})`;
        return `rgba(${rgb}, ${opacity})`;
    }

    // Particles (Silky Flow)
    const particles = [];
    const PARTICLE_COUNT = 50;

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = getThemeColor('--accent-rgb', this.alpha);
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    // Connect Lines
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = getThemeColor('--accent-rgb', 0.15 * (1 - dist / 100)); // Fade with dist
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
});
