// ── Layout Updater ──
function updateLayout() {
    const topBar = document.getElementById('status-bar');
    const bottomBar = document.getElementById('announcement-bar');
    const container = document.querySelector('.container');
    if (topBar && bottomBar && container) {
        container.style.paddingTop = topBar.offsetHeight + 'px';
        container.style.paddingBottom = bottomBar.offsetHeight + 'px';
    }
}
window.addEventListener('resize', updateLayout);
updateLayout();

// ── Theme Generation & Contrast ──
function getContrastColor(h, s, l) {
    // Basic lightness check for contrast
    return l > 60 ? '#000000' : '#FFFFFF';
}

function generateTheme(e, init = false) {
    let randomColor;
    let textColor;

    if (init && sessionStorage.getItem('themeColor') && sessionStorage.getItem('textColor')) {
        randomColor = sessionStorage.getItem('themeColor');
        textColor = sessionStorage.getItem('textColor');
    } else {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(50 + Math.random() * 50);
        const isDark = Math.random() > 0.5;
        const l = isDark ? Math.floor(5 + Math.random() * 15) : Math.floor(80 + Math.random() * 15);
        randomColor = `hsl(${h}, ${s}%, ${l}%)`;
        textColor = getContrastColor(h, s, l);
        
        sessionStorage.setItem('themeColor', randomColor);
        sessionStorage.setItem('textColor', textColor);
    }

    // Apply via CSS variables instead of inline !important styles
    const root = document.documentElement;
    root.style.setProperty('--bg-color', randomColor);
    root.style.setProperty('--text-color', textColor);

    if (e && e.clientX !== undefined) {
        // Ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'bg-ripple';
        const maxW = Math.max(e.clientX, window.innerWidth - e.clientX);
        const maxH = Math.max(e.clientY, window.innerHeight - e.clientY);
        const radius = Math.sqrt(maxW * maxW + maxH * maxH);
        const diameter = radius * 2;
        ripple.style.width = `${diameter}px`;
        ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - radius}px`;
        ripple.style.top = `${e.clientY - radius}px`;
        ripple.style.backgroundColor = randomColor;
        document.body.appendChild(ripple);
        
        // Force reflow
        void ripple.offsetWidth;
        ripple.style.transform = 'scale(1)';
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    currentFaviconColor = randomColor;
    currentFaviconTextColor = textColor;
    updateFavicon();
}

let currentFaviconColor = null;
let currentFaviconTextColor = '#FFFFFF';
let faviconTime = 0;
let faviconLink = null;

function updateFavicon() {
    if (!currentFaviconColor) return;
    
    let pathData = '';
    for (let x = 0; x <= 100; x += 2) {
        let y1 = 15 * Math.sin(x * 0.05 + faviconTime * 1.2);
        let y2 = 10 * Math.sin(x * 0.11 + faviconTime * 0.8);
        let y3 = 5 * Math.sin(x * 0.03 - faviconTime * 1.5);
        let y = 50 + y1 + y2 + y3;
        
        if (x === 0) {
            pathData += `M 0 ${y}`;
        } else {
            pathData += ` L ${x} ${y}`;
        }
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
            <clipPath id="circleClip">
                <circle cx="50" cy="50" r="50" />
            </clipPath>
        </defs>
        <circle cx="50" cy="50" r="50" fill="${currentFaviconColor}" />
        <path d="${pathData}" fill="none" stroke="${currentFaviconTextColor}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#circleClip)" />
    </svg>`;
    const faviconUrl = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgStr);

    const oldLink = document.querySelector("link[rel~='icon']");
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/svg+xml';
    newLink.href = faviconUrl;
    
    if (oldLink) {
        document.head.removeChild(oldLink);
    }
    document.head.appendChild(newLink);
}

setInterval(() => {
    if (document.hidden) return;
    faviconTime += 0.1; 
    updateFavicon();
}, 100);

generateTheme(null, true);

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BODY' || e.target.tagName === 'HTML' || e.target.closest('#theme-toggle')) {
        generateTheme(e);
    }
});

// ── Live Clock & Weather ──
let currentWeatherStr = sessionStorage.getItem('weatherStr') || '';

function fetchWeather() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=21.1702&longitude=72.8311&current_weather=true')
        .then(r => r.json())
        .then(data => {
            if (!data || !data.current_weather) return;
            const code = data.current_weather.weathercode;
            const temp = Math.round(data.current_weather.temperature);
            
            // WMO Weather Codes for rain/drizzle/thunderstorm
            const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
            
            const getSvg = (type) => {
                const b = `<svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin: 0 0.1rem;">`;
                if(type==='sun') return `${b}<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
                if(type==='cloud') return `${b}<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
                if(type==='rain') return `${b}<path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
                return `${b}<path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/><path d="M15 5l-3 3-3-3M19 9l-3 3 3 3M9 19l3-3 3 3M5 15l3-3-3-3"/></svg>`; // snow
            };

            if (rainCodes.includes(code)) {
                currentWeatherStr = ` \u2022 ${getSvg('rain')} ${temp}\u00B0C`;
                makeItRain();
            } else {
                let type = 'cloud';
                if (code === 0 || code === 1) type = 'sun';
                else if (code >= 71 && code <= 86) type = 'snow';
                currentWeatherStr = ` \u2022 ${getSvg(type)} ${temp}\u00B0C`;
                stopRain();
            }
            
            // Save string so it's instantly available on next page load
            sessionStorage.setItem('weatherStr', currentWeatherStr);
            updateClock();
        })
        .catch(() => {});
}

let rainCanvas = null;
let rainCtx = null;
let rainDrops = [];
let splatters = [];
let colliders = [];
let rainAnimFrame = null;

function makeItRain() {
    if (document.getElementById('rain-canvas')) return;
    
    rainCanvas = document.createElement('canvas');
    rainCanvas.id = 'rain-canvas';
    rainCanvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999;';
    document.documentElement.appendChild(rainCanvas);
    rainCtx = rainCanvas.getContext('2d');
    
    function resize() {
        rainCanvas.width = window.innerWidth * window.devicePixelRatio;
        rainCanvas.height = window.innerHeight * window.devicePixelRatio;
    }
    
    // Call resize immediately so canvas size is correct before drop init
    resize();
    window.addEventListener('resize', resize);
    
    // Persist rain state between page loads
    const storedState = sessionStorage.getItem('rainState');
    if (storedState) {
        try {
            rainDrops = JSON.parse(storedState);
        } catch(e) {}
        sessionStorage.removeItem('rainState');
    }
    
    // Init drops
    const numDrops = 60; // Reduced for cleaner aesthetic
    if (!rainDrops || rainDrops.length === 0 || rainDrops.length !== numDrops) {
        rainDrops = [];
        for(let i=0; i<numDrops; i++) {
            rainDrops.push({
                x: Math.random() * rainCanvas.width,
                y: Math.random() * rainCanvas.height,
                speed: (Math.random() * 12 + 10) * window.devicePixelRatio,
                length: (Math.random() * 15 + 10) * window.devicePixelRatio
            });
        }
    }
    
    window.addEventListener('beforeunload', () => {
        if (rainDrops && rainDrops.length > 0) {
            sessionStorage.setItem('rainState', JSON.stringify(rainDrops));
        } else {
            sessionStorage.removeItem('rainState');
        }
    });
    
    function draw() {
        rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
        
        const root = document.documentElement;
        let color = getComputedStyle(root).getPropertyValue('--text-color').trim();
        if (!color) color = '#ffffff';
        
        rainCtx.fillStyle = color;
        rainCtx.strokeStyle = color;
        rainCtx.lineWidth = 1 * window.devicePixelRatio;
        rainCtx.lineCap = 'round';
        
        // Draw splatters
        for(let i = splatters.length - 1; i >= 0; i--) {
            let s = splatters[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.5 * window.devicePixelRatio; // gravity
            s.life -= 1;
            
            rainCtx.globalAlpha = Math.max(0, s.life / 20);
            rainCtx.beginPath();
            rainCtx.arc(s.x, s.y, 1.2 * window.devicePixelRatio, 0, Math.PI * 2);
            rainCtx.fill();
            
            if (s.life <= 0) splatters.splice(i, 1);
        }
        
        // Draw drops
        rainCtx.globalAlpha = 0.4;
        rainCtx.beginPath();
        for(let drop of rainDrops) {
            let nextY = drop.y + drop.speed;
            
            // Splash at the bottom of the screen
            if (nextY > rainCanvas.height) {
                // Spawn 2-4 tiny splash particles
                const numSplashes = Math.floor(Math.random() * 3) + 2;
                for(let k=0; k<numSplashes; k++) {
                    splatters.push({
                        x: drop.x,
                        y: rainCanvas.height,
                        vx: (Math.random() - 0.5) * 4 * window.devicePixelRatio,
                        vy: (Math.random() * -4 - 1.5) * window.devicePixelRatio,
                        life: 10 + Math.random() * 10
                    });
                }
                
                drop.y = -drop.length - (Math.random() * 100);
                drop.x = Math.random() * rainCanvas.width;
            } else {
                rainCtx.moveTo(drop.x, drop.y);
                rainCtx.lineTo(drop.x, drop.y + drop.length);
                drop.y = nextY;
            }
        }
        rainCtx.stroke();
        rainCtx.globalAlpha = 1.0;
        
        rainAnimFrame = requestAnimationFrame(draw);
    }
    
    draw();
}

function stopRain() {
    if (rainCanvas) {
        rainCanvas.remove();
        rainCanvas = null;
    }
    if (rainAnimFrame) {
        cancelAnimationFrame(rainAnimFrame);
        rainAnimFrame = null;
    }
    rainDrops = [];
    splatters = [];
    sessionStorage.removeItem('rainState');
}

function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
    const timeString = now.toLocaleTimeString('en-US', options);
    const year = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    const clockEl = document.getElementById('live-clock');
    if (clockEl) clockEl.innerHTML = `Surat \u2022 ${year} \u2022 ${timeString}${currentWeatherStr}`;
    
    const delay = 60000 - (now.getTime() % 60000);
    setTimeout(updateClock, delay);
}

// Instantly resume rain if it was running previously to prevent load delay
if (sessionStorage.getItem('rainState')) {
    makeItRain();
}

// Fetch on load and every 30 mins
fetchWeather();
setInterval(fetchWeather, 30 * 60 * 1000);
updateClock();

// ── CSS-Based Availability Wave Animation ──
const freelanceText = document.getElementById('freelance-text');
if (freelanceText && !freelanceText.hasAttribute('data-waved')) {
    freelanceText.setAttribute('data-waved', 'true');
    const text = freelanceText.innerText || "Available for Freelance";
    freelanceText.innerHTML = '';
    
    // Accessibility: Screen readers read the label, hide the animated spans
    freelanceText.setAttribute('aria-label', text);
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        freelanceText.innerText = text;
    } else {
        freelanceText.style.display = 'inline-block';
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            span.className = 'wave-char';
            span.setAttribute('aria-hidden', 'true');
            span.style.animationDelay = `${i * 0.1}s`;
            freelanceText.appendChild(span);
        });
    }
}

// ── Page Transition & Prefetching ──
const pageContainer = document.querySelector('.container');
const backBtn = document.querySelector('#back-button');

let CURRENT_PAGE_INDEX = 0;
if (window.location.pathname.includes('/writing/') || window.location.pathname.endsWith('/writing')) CURRENT_PAGE_INDEX = 1;
else if (window.location.pathname.includes('how-i-use-ai')) CURRENT_PAGE_INDEX = 1.1;
else if (window.location.pathname.includes('practical-ai-usage')) CURRENT_PAGE_INDEX = 1.2;
else if (window.location.pathname.includes('who-am-i')) CURRENT_PAGE_INDEX = 2;
else if (window.location.pathname.includes('certificates')) CURRENT_PAGE_INDEX = 3;

const transitionDir = sessionStorage.getItem('transitionDirection');
if (transitionDir) {
    // Container is hidden via is-juggling (set in head script).
    // After a brief tick so the browser has painted the hidden state,
    // remove is-juggling, set the slide-in animation, and let it play.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.documentElement.classList.remove('is-juggling');
            document.documentElement.classList.add('is-transitioning');
            if (transitionDir === 'moving-right') {
                if (pageContainer) pageContainer.style.animation = 'slide-in-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                if (backBtn) backBtn.style.animation = 'unblur-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            } else if (transitionDir === 'moving-left') {
                if (pageContainer) pageContainer.style.animation = 'slide-in-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                if (backBtn) backBtn.style.animation = 'unblur-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            }
            setTimeout(() => {
                document.documentElement.classList.remove('is-transitioning');
            }, 700);
        });
    });
} else {
    document.documentElement.classList.remove('is-juggling');
}
sessionStorage.removeItem('transitionDirection');

const preloadedUrls = new Set();
document.querySelectorAll('a').forEach(link => {
    // Eagerly prefetch all internal links on load so they are ready before the loader finishes
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto')) {
        if (!preloadedUrls.has(href)) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
            preloadedUrls.add(href);
        }
    }

    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
        
        // Allow native behavior for "Open in New Tab" via modifiers
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

        e.preventDefault();

        let targetIndex = 0;
        if (href.includes('how-i-use-ai')) targetIndex = 1.1;
        else if (href.includes('practical-ai-usage')) targetIndex = 1.2;
        else if (href.includes('who-am-i')) targetIndex = 2;
        else if (href.includes('certificates')) targetIndex = 3;
        else if (href.endsWith('writing') || href.endsWith('writing/')) targetIndex = 1;

        // Add overflow class so slide-out is visible
        document.documentElement.classList.add('is-transitioning');

        if (targetIndex > CURRENT_PAGE_INDEX) {
            if (pageContainer) pageContainer.style.animation = 'slide-out-left 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            if (backBtn) backBtn.style.animation = 'blur-out 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            sessionStorage.setItem('transitionDirection', 'moving-right');
        } else if (targetIndex < CURRENT_PAGE_INDEX) {
            if (pageContainer) pageContainer.style.animation = 'slide-out-right 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            if (backBtn) backBtn.style.animation = 'blur-out 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            sessionStorage.setItem('transitionDirection', 'moving-left');
        } else {
            window.location.href = href;
            return;
        }

        setTimeout(() => {
            window.location.href = href;
        }, 450);
    });
});

// ── Visited State for Animation ──
if (!sessionStorage.getItem('visited')) {
    sessionStorage.setItem('visited', 'true');
} else {
    document.documentElement.classList.add('has-visited');
}
