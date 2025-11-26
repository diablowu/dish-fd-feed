export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.showRays = true;
        this.showNormals = false;
        this.showFeed = true;

        // View State
        this.zoom = 40; // Pixels per meter
        this.offset = { x: 0, y: 0 }; // Pan offset in pixels
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Interaction Listeners
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? 1 / (1 + zoomSpeed) : 1 + zoomSpeed;
        this.zoom *= delta;
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.offset.x += dx;
        this.offset.y += dy;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    clear() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Coordinate transform: Origin at bottom center, scale to fit
    toCanvas(x, y) {
        const cx = this.canvas.width / 2 + this.offset.x;
        const cy = this.canvas.height - 50 + this.offset.y; // Bottom margin + offset
        return {
            x: cx + x * this.zoom,
            y: cy - y * this.zoom
        };
    };

    drawParabola(parabola) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        const steps = 100;
        const halfD = parabola.D / 2;

        for (let i = 0; i <= steps; i++) {
            const x = -halfD + (parabola.D * i) / steps;
            const y = parabola.getY(x);
            const pos = this.toCanvas(x, y);
            if (i === 0) ctx.moveTo(pos.x, pos.y);
            else ctx.lineTo(pos.x, pos.y);
        }
        ctx.stroke();

        // Draw Focus
        const focusPos = this.toCanvas(0, parabola.f);
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(focusPos.x, focusPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFeed(feed, parabola) {
        const ctx = this.ctx;
        const feedY = parabola.f + feed.offset;
        const feedPos = this.toCanvas(0, feedY);

        // Draw Feed Point
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(feedPos.x, feedPos.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (!this.showRays) return;

        // Ray Tracing
        const numRays = 40;
        // Draw a bit wider than 10dB to show context
        const maxAngle = (feed.angle * 1.5) * (Math.PI / 180);
        const startAngle = -maxAngle / 2;
        const tenDbHalfAngle = (feed.angle / 2) * (Math.PI / 180);

        // Helper to trace a single ray
        const traceRay = (theta, isTenDbBoundary = false) => {
            const dirX = Math.sin(theta);
            const dirY = -Math.cos(theta);

            // Ray: P = F + t * D
            // x = 0 + t * dirX
            // y = feedY + t * dirY
            // Parabola: x^2 = 4fy
            // (t*dirX)^2 = 4f(feedY + t*dirY)
            // a*t^2 + b*t + c = 0

            const a = dirX * dirX;
            const b = -4 * parabola.f * dirY;
            const c = -4 * parabola.f * feedY;

            let t = -1;

            if (Math.abs(a) < 1e-6) {
                t = -c / b;
            } else {
                const delta = b * b - 4 * a * c;
                if (delta >= 0) {
                    const t1 = (-b - Math.sqrt(delta)) / (2 * a);
                    const t2 = (-b + Math.sqrt(delta)) / (2 * a);
                    if (t1 > 0) t = t1;
                    else if (t2 > 0) t = t2;
                }
            }

            if (t > 0) {
                const hitX = t * dirX;
                const hitY = feedY + t * dirY;
                const hitPos = this.toCanvas(hitX, hitY);

                // Check if hit is within dish diameter
                const isHit = Math.abs(hitX) <= parabola.D / 2;

                ctx.beginPath();
                if (isTenDbBoundary) {
                    ctx.strokeStyle = isHit ? '#00ff00' : '#ff0000'; // Green if hit, Red if spillover
                    ctx.lineWidth = 3;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 0, 0.1)';
                    ctx.lineWidth = 1;
                }

                ctx.moveTo(feedPos.x, feedPos.y);
                ctx.lineTo(hitPos.x, hitPos.y);
                ctx.stroke();

                if (isHit) {
                    // Reflection
                    const norm = parabola.getNormal(hitX);
                    const dot = dirX * norm.x + dirY * norm.y;
                    const refX = dirX - 2 * dot * norm.x;
                    const refY = dirY - 2 * dot * norm.y;

                    const refEnd = this.toCanvas(hitX + refX * 50, hitY + refY * 50);
                    ctx.beginPath();
                    if (isTenDbBoundary) {
                        ctx.strokeStyle = '#00ffff'; // Cyan for reflected 10dB
                        ctx.lineWidth = 2;
                    } else {
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
                        ctx.lineWidth = 1;
                    }
                    ctx.moveTo(hitPos.x, hitPos.y);
                    ctx.lineTo(refEnd.x, refEnd.y);
                    ctx.stroke();
                } else if (isTenDbBoundary) {
                    // If it misses the dish (spillover), extend the ray a bit further to show it missing
                    const missEnd = this.toCanvas(hitX + dirX * 20, hitY + dirY * 20);
                    ctx.beginPath();
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.moveTo(hitPos.x, hitPos.y);
                    ctx.lineTo(missEnd.x, missEnd.y);
                    ctx.stroke();
                }
            }
        };

        // Draw background rays
        for (let i = 0; i <= numRays; i++) {
            const theta = startAngle + (maxAngle * i) / numRays;
            traceRay(theta, false);
        }

        // Draw 10dB Boundary Rays
        traceRay(-tenDbHalfAngle, true);
        traceRay(tenDbHalfAngle, true);
    }
}
