
// ── Theme Generation & Contrast ──
function getContrastColor(h, s, l) {
    // Basic lightness check for contrast
    return l > 60 ? '#000000' : '#F3E5AB';
}

function generateTheme(e, init = false) {
    const root = document.documentElement;
    
    if (sessionStorage.getItem('siteArtworkData')) {
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--text-color', '#F3E5AB');
        return;
    }

    let randomColor = '#000000';
    let textColor = '#F3E5AB';

    sessionStorage.setItem('themeColor', randomColor);
    sessionStorage.setItem('textColor', textColor);

    // Apply via CSS variables instead of inline !important styles
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
let currentFaviconTextColor = '#F3E5AB';
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

// ── Page Prefetching ──
window.addEventListener('load', () => {
    const pages = ['/', '/writing/', '/who-am-i/', '/certificates/', '/art/'];
    pages.forEach(p => {
        if (window.location.pathname === p || window.location.pathname === p + 'index.html') return;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = p;
        document.head.appendChild(link);
    });
});

// ── Live Clock & Weather ──
// -- Page Transition & Prefetching --
const pageContainer = document.querySelector('.container');
const backBtn = document.querySelector('#back-button');

let CURRENT_PAGE_INDEX = 0;
if (window.location.pathname.includes('how-i-use-ai')) CURRENT_PAGE_INDEX = 1.1;
else if (window.location.pathname.includes('practical-ai-usage')) CURRENT_PAGE_INDEX = 1.2;
else if (window.location.pathname.includes('/writing/') || window.location.pathname.endsWith('/writing')) CURRENT_PAGE_INDEX = 1;
else if (window.location.pathname.includes('who-am-i')) CURRENT_PAGE_INDEX = 2;
else if (window.location.pathname.includes('certificates')) CURRENT_PAGE_INDEX = 3;
else if (window.location.pathname.includes('/art') || window.location.pathname.endsWith('art')) CURRENT_PAGE_INDEX = 4;

const transitionDir = sessionStorage.getItem('transitionDirection');
if (transitionDir) {
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
        else if (href.includes('/art') || href.endsWith('art')) targetIndex = 4;
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
if (!sessionStorage.getItem('visited_v2')) {
    sessionStorage.setItem('visited_v2', 'true');
} else {
    document.documentElement.classList.add('has-visited');
}

// ── Fish Tracing Animation & Background Artwork ──
let siteArtworkImg = null;
let siteImgData = null;
let siteDrawParams = null;

let globalLoaderState = {
    active: false,
    isImageReady: false,
    minTimePassed: false,
    imageUrl: null,
    artworkLayerEl: null,
    overlayEl: null,
    containerEl: null,
    cells: [],
    total: 0,
    lastIndex: 0
};

function startGlobalSweep() {
    if (globalLoaderState.isImageReady && globalLoaderState.minTimePassed && !globalLoaderState.active) {
        globalLoaderState.active = true;
        
        requestAnimationFrame(loaderAnimationLoop);
        
        // After sweep finishes (2.5s), trigger zoom animation and text reveal
        setTimeout(() => {
            const greeting = document.getElementById('global-greeting-wrapper');
            if (greeting) greeting.style.display = 'none';
            
            const zoomLayer = document.getElementById('global-artwork-zoom-layer');
            if (zoomLayer) {
                zoomLayer.style.opacity = '1';
                
                if (globalLoaderState.artworkLayerEl) {
                    globalLoaderState.artworkLayerEl.style.opacity = '0';
                }
                
                void zoomLayer.offsetWidth; // force reflow
                
                zoomLayer.style.transition = 'filter 1.2s cubic-bezier(0.77, 0, 0.175, 1), background-size 1.2s cubic-bezier(0.77, 0, 0.175, 1)';
                zoomLayer.style.backgroundSize = zoomLayer.dataset.coverSize;
                zoomLayer.style.backgroundPosition = 'center';
                zoomLayer.style.filter = 'blur(6px)';
            }
            
            if (globalLoaderState.overlayEl) globalLoaderState.overlayEl.style.opacity = '1';
            document.documentElement.style.setProperty('--text-color', '#F3E5AB');
            document.documentElement.classList.add('has-artwork');
            document.documentElement.classList.add('reveal-text');
            document.documentElement.classList.remove('initial-load');
            
            setTimeout(() => {
                if (globalLoaderState.containerEl) {
                    globalLoaderState.containerEl.style.zIndex = '0';
                }
                const path = window.location.pathname;
                if (path === '/' || path === '/index.html' || path === '') {
                    window.location.href = '/home';
                }
            }, 1200);
        }, 2500);
    }
}

function loaderAnimationLoop(time) {
    const state = globalLoaderState;
    if (!state.active) return;
    
    if (!state.startTime) state.startTime = time;
    const elapsed = time - state.startTime;
    
    const duration = 2500; // 2.5 seconds for the full terminal sweep
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;

    // line by line with a block!
    for (let i = state.lastIndex; i < state.total; i++) {
        const cellProgress = i / state.total; 
        
        if (progress >= cellProgress) {
            state.cells[i].style.opacity = '1';
            state.lastIndex = i + 1;
        } else {
            break;
        }
    }
    
    if (progress < 1) {
        requestAnimationFrame(loaderAnimationLoop);
    }
}

function createGlobalLoader() {
    return new Promise((resolveLoader) => {
    if (window.DISABLE_GLOBAL_LOADER) return resolveLoader();
    let bgContainer = document.getElementById('global-artwork-bg');
    if (!bgContainer) {
        bgContainer = document.createElement('div');
        bgContainer.id = 'global-artwork-bg';
        Object.assign(bgContainer.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: '#F3E5AB', zIndex: '99999', overflow: 'hidden'
        });
        
        // Greeting Layer (z-index: 1)
        const greetingWrapper = document.createElement('div');
        greetingWrapper.id = 'global-greeting-wrapper';
        Object.assign(greetingWrapper.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1.2rem', zIndex: '1', overflow: 'hidden', padding: '2rem', boxSizing: 'border-box'
        });
        
        const enterBtn = document.createElement('button');
        enterBtn.textContent = 'Enter';
        Object.assign(enterBtn.style, {
            position: 'relative',
            padding: '12px 36px',
            borderRadius: '50px',
            backgroundColor: 'transparent',
            color: '#000000',
            border: '1px solid rgba(0, 0, 0, 0.4)',
            fontFamily: "'Ballet', cursive",
            fontSize: '1.75rem',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.6s ease',
            opacity: '0',
            filter: 'blur(20px)',
            transform: 'scale(0.95)'
        });
        


        const loadingText = document.createElement('div');
        loadingText.innerHTML = "loading<span class='loading-dots'></span>";
        Object.assign(loadingText.style, {
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            color: '#000000',
            fontWeight: '400',
            opacity: '0',
            position: 'absolute',
            transition: 'opacity 0.6s ease',
            pointerEvents: 'none'
        });

        const nameText = document.createElement('div');
        nameText.textContent = "Jaival Kachiwala";
        Object.assign(nameText.style, {
            position: 'relative',
            fontFamily: "'Ballet', cursive",
            fontSize: 'clamp(3.25rem, 9vw, 4rem)',
            fontWeight: '400',
            color: '#000000',
            opacity: '0',
            filter: 'blur(10px)',
            transition: 'all 0.6s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
        });



        const notes = [
            "welcome to my digital playground.",
            "a collection of thoughts, code, and visual noise.",
            "built for those who appreciate the details.",
            "everything you see here was built entirely from scratch.",
            "currently available for freelance projects.",
            "based in Surat."
        ];
        
        let currentNoteIndex = Math.floor(Math.random() * notes.length);
        const noteText = document.createElement('div');
        noteText.textContent = notes[currentNoteIndex];
        Object.assign(noteText.style, {
            position: 'relative',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '0.85rem',
            color: '#000000',
            opacity: '0',
            filter: 'blur(10px)',
            transition: 'all 0.6s ease',
            pointerEvents: 'none',
            textAlign: 'center'
        });

        const fishBg = document.createElement('img');
        fishBg.src = '/fish.svg';
        fishBg.className = 'enter-fish-bg';
        Object.assign(fishBg.style, {
            opacity: '0',
            filter: 'blur(20px) invert(1) brightness(0.15)',
            transition: 'all 2s ease-out'
        });

        greetingWrapper.appendChild(nameText);
        greetingWrapper.appendChild(noteText);
        greetingWrapper.appendChild(enterBtn);
        greetingWrapper.appendChild(loadingText);
        
        let noteInterval;
        requestAnimationFrame(() => {
            // Fish fades in first
            setTimeout(() => {
                fishBg.style.opacity = '0.15';
                fishBg.style.filter = 'blur(0px) invert(1) brightness(0.15)';
            }, 100);

            // Enter button and text fade in after fish fully appears (2s transition + buffer)
            setTimeout(() => {
                enterBtn.style.opacity = '1';
                enterBtn.style.filter = 'blur(0px)';
                enterBtn.style.transform = 'scale(1)';
                
                nameText.style.opacity = '1';
                nameText.style.filter = 'blur(0px)';
            }, 2300);
            
            setTimeout(() => {
                noteText.style.opacity = '0.7';
                noteText.style.filter = 'blur(0px)';
                
                noteInterval = setInterval(() => {
                    noteText.style.opacity = '0';
                    noteText.style.filter = 'blur(10px)';
                    
                    setTimeout(() => {
                        currentNoteIndex = (currentNoteIndex + 1) % notes.length;
                        noteText.textContent = notes[currentNoteIndex];
                        noteText.style.opacity = '0.7';
                        noteText.style.filter = 'blur(0px)';
                    }, 600);
                }, 3500);
            }, 3000);
        });

        enterBtn.onclick = () => {
            if (noteInterval) clearInterval(noteInterval);
            noteText.style.opacity = '0';
            noteText.style.filter = 'blur(20px)';
            
            setTimeout(() => {
                enterBtn.style.opacity = '0';
                enterBtn.style.filter = 'blur(20px)';
                enterBtn.style.pointerEvents = 'none';
                
                nameText.style.opacity = '0';
                nameText.style.filter = 'blur(20px)';
                
                setTimeout(() => {
                    loadingText.style.opacity = '1';
                    resolveLoader();
                    
                    setTimeout(() => {
                        globalLoaderState.minTimePassed = true;
                        startGlobalSweep();
                    }, 350);
                }, 600);
            }, 400);
        };
        
        bgContainer.appendChild(fishBg);
        bgContainer.appendChild(greetingWrapper);
        
        // Artwork Layer (z-index: 2)
        const artworkLayer = document.createElement('div');
        Object.assign(artworkLayer.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '2', display: 'grid', pointerEvents: 'none',
            filter: 'blur(0px)',
            transform: 'scale(1)'
        });
        
        const cols = 40;
        const rows = 30;
        const total = rows * cols;
        artworkLayer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        artworkLayer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        const cells = [];
        for(let i = 0; i < total; i++) {
            const cell = document.createElement('div');
            
            cell.style.opacity = '0';
            cell.style.backgroundColor = 'transparent';
            cell.style.backgroundRepeat = 'no-repeat';
            cell.style.transition = 'opacity 0.1s ease';
            
            artworkLayer.appendChild(cell);
            cells.push(cell);
        }
        
        bgContainer.appendChild(artworkLayer);
        
        // Zoom Layer (z-index: 3)
        const zoomLayer = document.createElement('div');
        zoomLayer.id = 'global-artwork-zoom-layer';
        Object.assign(zoomLayer.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '3', pointerEvents: 'none', backgroundRepeat: 'no-repeat',
            opacity: '0', filter: 'blur(0px)'
        });
        bgContainer.appendChild(zoomLayer);
        
        // Overlay Layer (z-index: 4)
        let bgOverlay = document.createElement('div');
        bgOverlay.id = 'global-artwork-overlay';
        Object.assign(bgOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.35)', opacity: '0', transition: 'opacity 1s ease-in-out',
            zIndex: '4', pointerEvents: 'none'
        });
        bgContainer.appendChild(bgOverlay);
        
        document.body.prepend(bgContainer);
        
        globalLoaderState = {
            active: false,
            isImageReady: false,
            minTimePassed: false,
            imageUrl: null,
            artworkLayerEl: artworkLayer,
            overlayEl: bgOverlay,
            containerEl: bgContainer,
            cells: cells,
            total: total,
            lastIndex: 0
        };
    } else {
        resolveLoader();
    }
    
    });
}

async function fetchArtworkWithFallbacks() {
    // 1. Try Met Museum (Sequential)
    try {
        let objectIds = null;
        const cachedIds = localStorage.getItem('siteMetObjectIdsNatureV1');
        if (cachedIds) {
            objectIds = JSON.parse(cachedIds);
        } else {
            const searchRes = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?medium=Paintings&hasImages=true&q=nature%20landscape');
            const searchData = await searchRes.json();
            objectIds = searchData.objectIDs;
            if (objectIds && objectIds.length > 0) {
                localStorage.setItem('siteMetObjectIdsNatureV1', JSON.stringify(objectIds));
            }
        }
        if (objectIds && objectIds.length > 0) {
            const randomIds = Array.from({length: 5}, () => objectIds[Math.floor(Math.random() * objectIds.length)]);
            for (let id of randomIds) {
                try {
                    const r = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id);
                    if (r.status === 403) break; // Rate limited, stop hitting Met
                    const data = await r.json();
                    if (data && (data.primaryImageSmall || data.primaryImage)) {
                        return data;
                    }
                } catch(e) {}
            }
        }
    } catch (e) {
        console.warn("Met API failed", e);
    }
    
    // 2. Try Cleveland Museum of Art (Highly reliable, no CORS issues usually)
    try {
        const res = await fetch(`https://openaccess-api.clevelandart.org/api/artworks/?q=nature%20landscape&has_image=1&limit=20&skip=${Math.floor(Math.random()*100)}`);
        const data = await res.json();
        if (data && data.data && data.data.length > 0) {
            const art = data.data[Math.floor(Math.random() * data.data.length)];
            if (art.images && art.images.web && art.images.web.url) {
                return {
                    primaryImageSmall: art.images.web.url,
                    title: art.title,
                    artistDisplayName: art.creators && art.creators.length > 0 ? art.creators[0].description : 'Unknown Artist',
                    objectDate: art.creation_date,
                    medium: art.technique,
                    culture: art.culture ? art.culture[0] : '',
                    dimensions: art.measurements
                };
            }
        }
    } catch (e) {
        console.warn("Cleveland Museum API failed.", e);
    }

    // 3. Fallback Images
    const fallbackImages = [
        "https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg",
        "https://images.metmuseum.org/CRDImages/ep/original/DP146468.jpg",
        "https://images.metmuseum.org/CRDImages/ep/original/DT1502_4.jpg",
        "https://images.metmuseum.org/CRDImages/ep/original/DP134265.jpg",
        "https://images.metmuseum.org/CRDImages/ep/original/DP-20220-001.jpg"
    ];
    return {
        primaryImageSmall: fallbackImages[Math.floor(Math.random() * fallbackImages.length)],
        title: "Classic Landscape",
        artistDisplayName: "Unknown Artist",
        objectDate: "19th Century",
        medium: "Oil on canvas"
    };
}

async function initArtworkBackground() {
    let artworkData = null;
    let wasCached = false;
    let isReload = false;
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        isReload = true;
    }
    const isRoot = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '';
    const isInitialLoad = (document.documentElement.classList.contains('initial-load') || isReload) && isRoot;
    
    if (!isRoot) {
        document.documentElement.classList.add('reveal-text');
        setTimeout(() => {
            document.documentElement.classList.remove('initial-load');
        }, 2000);
    }
    
    if (isInitialLoad) {
        await createGlobalLoader();
    }
    
    try {
        const stored = sessionStorage.getItem('siteArtworkData');
        if (stored && !isReload) {
            artworkData = JSON.parse(stored);
            wasCached = true;
        }
    } catch(e) {}

    if (!artworkData) {
        artworkData = await fetchArtworkWithFallbacks();
        if (artworkData) {
            sessionStorage.setItem('siteArtworkData', JSON.stringify(artworkData));
        }
    }

    if (artworkData) {
        window.dispatchEvent(new CustomEvent('artworkDataLoaded', { detail: artworkData }));
        const rawUrl = artworkData.primaryImageSmall || artworkData.primaryImage;
        const proxyUrl = rawUrl.includes('artic.edu') ? rawUrl : "https://wsrv.nl/?url=" + encodeURIComponent(rawUrl);
        
        if (wasCached && !isInitialLoad) {
            setupArtworkBackground(proxyUrl, true);
        } else {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            
            const applyImage = (url, loadedImg) => {
                if (globalLoaderState.artworkLayerEl) {
                    globalLoaderState.imageUrl = url;
                    
                    const imgW = loadedImg.naturalWidth;
                    const imgH = loadedImg.naturalHeight;
                    const aspect = imgW / imgH;
                    const screenW = window.innerWidth;
                    const screenH = window.innerHeight;
                    const screenAspect = screenW / screenH;
                    
                    // Cover math (Target)
                    let coverW, coverH;
                    if (screenAspect > aspect) {
                        coverW = screenW;
                        coverH = screenW / aspect;
                    } else {
                        coverH = screenH;
                        coverW = screenH * aspect;
                    }
                    const coverOffsetX = (coverW - screenW) / 2;
                    const coverOffsetY = (coverH - screenH) / 2;

                    // Contain math (Initial)
                    const maxH = screenH * 0.55;
                    const maxW = screenW;
                    let containW, containH;
                    if (maxW / maxH > aspect) {
                        containH = maxH;
                        containW = maxH * aspect;
                    } else {
                        containW = maxW;
                        containH = maxW / aspect;
                    }
                    const containOffsetX = (containW - screenW) / 2;
                    const containOffsetY = (containH - screenH) / 2;
                    
                    const zoomLayer = document.getElementById('global-artwork-zoom-layer');
                    if (zoomLayer) {
                        zoomLayer.style.backgroundImage = `url('${url}')`;
                        zoomLayer.style.backgroundSize = `${containW}px ${containH}px`;
                        zoomLayer.style.backgroundPosition = 'center';
                        zoomLayer.dataset.coverSize = `${coverW}px ${coverH}px`;
                    }
                    
                    const cols = 40;
                    const rows = 30;

                    globalLoaderState.cells.forEach((cell, i) => {
                        const c = i % cols;
                        const r = Math.floor(i / cols);
                        
                        const cellLeft = (c / cols) * screenW;
                        const cellTop = (r / rows) * screenH;
                        
                        cell.style.backgroundImage = `url('${url}')`;
                        cell.style.backgroundRepeat = 'no-repeat';
                        cell.style.backgroundSize = `${containW}px ${containH}px`;
                        cell.style.backgroundPosition = `${-(cellLeft + containOffsetX)}px ${-(cellTop + containOffsetY)}px`;
                    });
                    
                    globalLoaderState.isImageReady = true;
                    startGlobalSweep();
                } else {
                    setupArtworkBackground(url, false);
                }
            };
            
            img.onload = () => applyImage(proxyUrl, img);
            img.onerror = () => {
                // Try raw URL
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = "Anonymous";
                fallbackImg.onload = () => applyImage(rawUrl, fallbackImg);
                fallbackImg.onerror = () => {
                    console.error("Both proxy and raw URL failed to load.");
                    globalLoaderState.isImageReady = true;
                    startGlobalSweep();
                };
                fallbackImg.src = rawUrl;
            };
            img.src = proxyUrl;
        }
    }
}

function setupArtworkBackground(imageUrl, isCached) {
    let bgContainer = document.getElementById('global-artwork-bg');
    if (!bgContainer) {
        bgContainer = document.createElement('div');
        bgContainer.id = 'global-artwork-bg';
        
        Object.assign(bgContainer.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: '#FFFFFF',
            backgroundImage: `url('${imageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: '0', 
            opacity: '1',
            filter: 'blur(6px)',
            transform: 'scale(1.03)'
        });
        
        const bgOverlay = document.createElement('div');
        bgOverlay.id = 'global-artwork-overlay';
        Object.assign(bgOverlay.style, {
            position: 'absolute',
            top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            opacity: '1'
        });
        
        bgContainer.appendChild(bgOverlay);
        document.body.prepend(bgContainer);
    } else {
        // If it was already set up via the loader, we just need to ensure opacity is 1
        // and we might need to set the background if it wasn't set.
        const zoomLayer = document.getElementById('global-artwork-zoom-layer');
        if (zoomLayer) {
            zoomLayer.style.backgroundImage = `url('${imageUrl}')`;
            zoomLayer.style.backgroundSize = 'cover';
            zoomLayer.style.backgroundPosition = 'center';
            zoomLayer.style.filter = 'blur(6px)';
            zoomLayer.style.opacity = '1';
        }
        
        if (globalLoaderState && globalLoaderState.artworkLayerEl) {
            globalLoaderState.artworkLayerEl.style.opacity = '0';
        } else {
            bgContainer.style.backgroundImage = `url('${imageUrl}')`;
        }
        const bgOverlay = document.getElementById('global-artwork-overlay');
        if(bgOverlay) bgOverlay.style.opacity = '1';
    }
    
    document.documentElement.style.setProperty('--text-color', '#F3E5AB');
    document.documentElement.classList.add('has-artwork');
    
    if (!document.getElementById('kill-fish-style')) {
        const style = document.createElement('style');
        style.id = 'kill-fish-style';
        style.textContent = '.fish-svg-bg { display: none !important; opacity: 0 !important; visibility: hidden !important; }';
        document.head.appendChild(style);
    }
    setInterval(() => {
        const f = document.querySelector('.fish-svg-bg');
        if (f) f.remove();
    }, 500);
}
// Run background init immediately since script is at the bottom of the body
initArtworkBackground();


// --- FILM GRAIN OVERLAY ---
(function initGrain() {
    const grain = document.createElement('div');
    grain.id = 'film-grain-layer';
    Object.assign(grain.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '2147483647',
        opacity: '0.2',
        backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMS4yIiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+")',
        mixBlendMode: 'overlay'
    });
    // Append to body after DOM is loaded or immediately if already loaded
    if (document.body) {
        document.body.appendChild(grain);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(grain));
    }
})();

// --- MOUSE TRAIL & GRID CURSOR (desktop only) ---
(function initGridCursor() {
    // Skip entirely on touch-primary devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    let lastGridX = -1;
    let lastGridY = -1;
    let lastClientX = -1;
    let lastClientY = -1;
    let isOverLink = false;
    let isCtrlDown = false;
    let isSnakeMode = false;
    let snakeInterval = null;
    let snakeBody = []; 
    let snakeDir = {x: 0, y: 0};
    let applePos = {x: -1, y: -1};
    let score = 0;
    let snakeSegments = [];
    let appleEl = null;
    let scoreEl = null;
    
    const gridSize = 8;
    const isRootPage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '';
    const getBaseColor = () => isRootPage ? '#000000' : (getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#F3E5AB');

    const randColor = () => `hsl(${Math.random() * 360 | 0}, 90%, 65%)`;

    // Dynamically repaint the favicon square
    const faviconLink = document.querySelector('link[rel="icon"]');
    const faviconCanvas = document.createElement('canvas');
    faviconCanvas.width = 32;
    faviconCanvas.height = 32;
    const faviconCtx = faviconCanvas.getContext('2d');

    const updateFavicon = (color) => {
        faviconCtx.clearRect(0, 0, 32, 32);
        faviconCtx.fillStyle = color;
        faviconCtx.fillRect(0, 0, 32, 32);
        if (faviconLink) faviconLink.href = faviconCanvas.toDataURL('image/png');
    };

    // Init favicon with base color
    updateFavicon(getBaseColor());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Control') {
            isCtrlDown = true;
            const c = randColor();
            activeSquare.style.backgroundColor = c;
            updateFavicon(c);
        }

        if (!isSnakeMode) {
            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -1;
            else if (e.key === 'ArrowDown') dy = 1;
            else if (e.key === 'ArrowLeft') dx = -1;
            else if (e.key === 'ArrowRight') dx = 1;
            
            if (dx !== 0 || dy !== 0) {
                const sx = lastGridX === -1 ? Math.floor(window.innerWidth / 2 / gridSize) : lastGridX;
                const sy = lastGridY === -1 ? Math.floor(window.innerHeight / 2 / gridSize) : lastGridY;
                startSnake(sx, sy, dx, dy);
                e.preventDefault();
            }
        } else {
            if (e.key === 'ArrowUp' && snakeDir.y !== 1) { snakeDir = {x: 0, y: -1}; e.preventDefault(); }
            else if (e.key === 'ArrowDown' && snakeDir.y !== -1) { snakeDir = {x: 0, y: 1}; e.preventDefault(); }
            else if (e.key === 'ArrowLeft' && snakeDir.x !== 1) { snakeDir = {x: -1, y: 0}; e.preventDefault(); }
            else if (e.key === 'ArrowRight' && snakeDir.x !== -1) { snakeDir = {x: 1, y: 0}; e.preventDefault(); }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') {
            isCtrlDown = false;
            if (!isOverLink) activeSquare.style.backgroundColor = getBaseColor();
            updateFavicon(getBaseColor());
        }
    });
    // Reset if window loses focus while Ctrl held
    window.addEventListener('blur', () => {
        isCtrlDown = false;
        if (!isOverLink && !isSnakeMode) activeSquare.style.backgroundColor = getBaseColor();
        updateFavicon(getBaseColor());
    });

    const PIXEL_FONT = {
        '0': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
        '1': [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1],
        '2': [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1],
        '3': [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1],
        '4': [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1],
        '5': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1],
        '6': [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1],
        '7': [1,1,1, 0,0,1, 0,1,0, 0,1,0, 0,1,0],
        '8': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1],
        '9': [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1]
    };
    
    function drawPixelScore(scoreValue) {
        scoreEl.innerHTML = '';
        const str = scoreValue.toString();
        let offsetX = 0;
        for (let i = 0; i < str.length; i++) {
            const digit = PIXEL_FONT[str[i]];
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 3; c++) {
                    if (digit[r * 3 + c]) {
                        const px = document.createElement('div');
                        Object.assign(px.style, {
                            position: 'absolute',
                            width: '8px', height: '8px',
                            backgroundColor: '#F3E5AB',
                            left: ((offsetX + c) * 8) + 'px',
                            top: (r * 8) + 'px'
                        });
                        scoreEl.appendChild(px);
                    }
                }
            }
            offsetX += 4; // 3 cols + 1 gap
        }
        scoreEl.style.width = ((offsetX - 1) * 8) + 'px';
        scoreEl.style.height = (5 * 8) + 'px';
    }

    function startSnake(startX, startY, dirX, dirY) {
        isSnakeMode = true;
        snakeDir = {x: dirX, y: dirY};
        snakeBody = [{x: Math.floor(startX / 2), y: Math.floor(startY / 2)}];
        score = 0;
        
        activeSquare.style.width = '16px';
        activeSquare.style.height = '16px';
        
        if (!scoreEl) {
            scoreEl = document.createElement('div');
            Object.assign(scoreEl.style, {
                position: 'fixed', top: '20px', right: '20px', 
                zIndex: '2147483647', pointerEvents: 'none', mixBlendMode: 'difference'
            });
            document.body.appendChild(scoreEl);
        }
        drawPixelScore(score);
        scoreEl.style.display = 'block';

        if (!appleEl) {
            appleEl = document.createElement('div');
            Object.assign(appleEl.style, {
                position: 'fixed', width: '16px', height: '16px', 
                backgroundColor: 'red', zIndex: '2147483647', pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            });
            document.body.appendChild(appleEl);
        }
        appleEl.style.display = 'block';
        
        spawnApple();
        snakeInterval = setInterval(snakeTick, 120);
    }
    
    function spawnApple() {
        const head = snakeBody[0];
        const minX = Math.max(1, head.x - 15);
        const maxX = Math.min(Math.floor(window.innerWidth / 16) - 1, head.x + 15);
        const minY = Math.max(1, head.y - 15);
        const maxY = Math.min(Math.floor(window.innerHeight / 16) - 1, head.y + 15);
        
        applePos.x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        applePos.y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        
        appleEl.style.left = (applePos.x * 16 + 8) + 'px';
        appleEl.style.top = (applePos.y * 16 + 8) + 'px';
    }

    function snakeTick() {
        const head = snakeBody[0];
        const nextX = head.x + snakeDir.x;
        const nextY = head.y + snakeDir.y;
        
        const maxX = Math.floor(window.innerWidth / 16);
        const maxY = Math.floor(window.innerHeight / 16);
        
        if (nextX < 0 || nextX >= maxX || nextY < 0 || nextY >= maxY) return gameOver();
        
        for (let i = 0; i < snakeBody.length; i++) {
            if (snakeBody[i].x === nextX && snakeBody[i].y === nextY) return gameOver();
        }
        
        snakeBody.unshift({x: nextX, y: nextY});
        
        if (nextX === applePos.x && nextY === applePos.y) {
            score++;
            drawPixelScore(score);
            spawnApple();
        } else {
            snakeBody.pop();
        }
        
        renderSnake();
    }
    
    function renderSnake() {
        activeSquare.style.left = (snakeBody[0].x * 16 + 8) + 'px';
        activeSquare.style.top = (snakeBody[0].y * 16 + 8) + 'px';
        
        while (snakeSegments.length < snakeBody.length - 1) {
            const seg = document.createElement('div');
            Object.assign(seg.style, {
                position: 'fixed', width: '16px', height: '16px', 
                backgroundColor: '#F3E5AB', zIndex: '2147483647', pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            });
            document.body.appendChild(seg);
            snakeSegments.push(seg);
        }
        
        for (let i = 0; i < snakeSegments.length; i++) {
            if (i < snakeBody.length - 1) {
                snakeSegments[i].style.display = 'block';
                snakeSegments[i].style.left = (snakeBody[i+1].x * 16 + 8) + 'px';
                snakeSegments[i].style.top = (snakeBody[i+1].y * 16 + 8) + 'px';
            } else {
                snakeSegments[i].style.display = 'none';
            }
        }
        lastGridX = snakeBody[0].x * 2;
        lastGridY = snakeBody[0].y * 2;
    }
    
    function gameOver() {
        clearInterval(snakeInterval);
        isSnakeMode = false;
        
        const highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
        if (score > highScore) {
            localStorage.setItem('snakeHighScore', score.toString());
        }
        
        if (scoreEl) scoreEl.style.display = 'none';
        if (appleEl) appleEl.style.display = 'none';
        snakeSegments.forEach(seg => seg.style.display = 'none');
        activeSquare.style.backgroundColor = 'red';
        activeSquare.style.width = '8px';
        activeSquare.style.height = '8px';
        setTimeout(() => activeSquare.style.backgroundColor = getBaseColor(), 500);
    }


    
    const activeSquare = document.createElement('div');
    activeSquare.id = 'active-grid-cursor';
    Object.assign(activeSquare.style, {
        position: 'fixed',
        width: '8px',
        height: '8px',
        backgroundColor: getBaseColor(),
        pointerEvents: 'none',
        zIndex: '2147483647',
        transform: 'translate(-50%, -50%)',
        opacity: '0'
    });
    
    if (document.body) {
        document.body.appendChild(activeSquare);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(activeSquare));
    }

    document.addEventListener('mousemove', (e) => {
        if (isSnakeMode) {
            if (lastClientX !== -1 && Math.abs(e.clientX - lastClientX) < 10 && Math.abs(e.clientY - lastClientY) < 10) {
                return;
            }
            gameOver();
        }
        
        lastClientX = e.clientX;
        lastClientY = e.clientY;

        const gridX = Math.floor(e.clientX / gridSize);
        const gridY = Math.floor(e.clientY / gridSize);
        
        activeSquare.style.opacity = '1';

        if (lastGridX === -1) {
            lastGridX = gridX;
            lastGridY = gridY;
            activeSquare.style.left = (gridX * gridSize + gridSize / 2) + 'px';
            activeSquare.style.top = (gridY * gridSize + gridSize / 2) + 'px';
            return;
        }

        if (gridX === lastGridX && gridY === lastGridY) return;
        
        let x0 = lastGridX;
        let y0 = lastGridY;
        const x1 = gridX;
        const y1 = gridY;
        
        const dx = Math.abs(x1 - x0);
        const dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;

        while (true) {
            if (!isOverLink && !(x0 === x1 && y0 === y1)) {
                const trailSquare = document.createElement('div');
                trailSquare.className = 'mouse-trail-square';
                trailSquare.style.left = (x0 * gridSize + gridSize / 2) + 'px';
                trailSquare.style.top = (y0 * gridSize + gridSize / 2) + 'px';
                trailSquare.style.backgroundColor = getBaseColor();
                if (isCtrlDown) trailSquare.style.backgroundColor = randColor();
                document.body.appendChild(trailSquare);
                
                setTimeout(() => {
                    trailSquare.remove();
                }, 350);
            }

            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }

        activeSquare.style.left = (gridX * gridSize + gridSize / 2) + 'px';
        activeSquare.style.top = (gridY * gridSize + gridSize / 2) + 'px';

        lastGridX = gridX;
        lastGridY = gridY;
    });

    document.addEventListener('mouseleave', () => {
        activeSquare.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        activeSquare.style.opacity = '1';
    });

    // Link hover: square becomes hollow outline, trail disabled
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a, button, [role="button"]');
        if (link) {
            isOverLink = true;
            activeSquare.style.backgroundColor = 'transparent';
            activeSquare.style.border = `1.5px solid ${getBaseColor()}`;
            activeSquare.style.width = '14px';
            activeSquare.style.height = '14px';
        }
    });

    document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('a, button, [role="button"]');
        if (link) {
            isOverLink = false;
            activeSquare.style.backgroundColor = getBaseColor();
            activeSquare.style.border = 'none';
            activeSquare.style.width = '8px';
            activeSquare.style.height = '8px';
        }
    });

    // --- PREPARE QR MATRIX FOR GOL ---
    let qrMatrix = null;
    let qrCount = 29;
    const qrScript = document.createElement('script');
    qrScript.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    qrScript.onload = () => {
        const qr = qrcode(0, 'L');
        qr.addData('https://jaival.nfy.fyi/');
        qr.make();
        qrCount = qr.getModuleCount();
        const offset = Math.floor(qrCount / 2);
        
        qrMatrix = [];
        for (let r = 0; r < qrCount; r++) {
            for (let c = 0; c < qrCount; c++) {
                if (qr.isDark(r, c)) {
                    qrMatrix.push({ dx: c - offset, dy: r - offset });
                }
            }
        }
    };
    document.head.appendChild(qrScript);

    // --- GAME OF LIFE + QR SEQUENCE ON CLICK ---
    let golInterval = null;
    let golCells = new Set();
    let golElements = new Map();
    let golGenerations = 0;
    let golCenter = {x: 0, y: 0};
    
    document.addEventListener('click', (e) => {
        if (!e.ctrlKey || e.target.closest('a, button, [role="button"]') || isSnakeMode) return;
        
        const cx = Math.floor(e.clientX / gridSize);
        const cy = Math.floor(e.clientY / gridSize);
        
        golGenerations = 0;
        golCenter = {x: cx, y: cy};
        golCells.clear();
        
        const offset = Math.floor(qrCount / 2);
        for (let dy = -offset; dy <= qrCount - offset; dy++) {
            for (let dx = -offset; dx <= qrCount - offset; dx++) {
                if (Math.random() > 0.6) {
                    golCells.add(`${cx + dx},${cy + dy}`);
                }
            }
        }
        
        if (!golInterval) {
            golInterval = setInterval(golTick, 150);
        }
        renderGol();
    });
    
    function golTick() {
        if (golCells.size === 0 && golGenerations > 20) {
            cleanupGol();
            return;
        }
        
        golGenerations++;
        
        if (golGenerations <= 20) {
            // Normal tick
            golCells = calculateNextGen();
            renderGol();
        } 
        else if (golGenerations > 20 && golGenerations <= 30) {
            // Forming QR
            if (!qrMatrix) { 
                golCells = calculateNextGen(); 
                renderGol(); 
                return; 
            }
            
            const nextGen = calculateNextGen(); // Game of Life keeps running!
            
            const maxRadius = Math.ceil(qrCount / 2) + 2; 
            const currentRadius = ((golGenerations - 20) / 10) * maxRadius;
            
            const finalGen = new Set();
            
            // Keep simulated cells that are OUTSIDE the forming radius
            for (const cell of nextGen) {
                const [xStr, yStr] = cell.split(',');
                const x = parseInt(xStr, 10);
                const y = parseInt(yStr, 10);
                const dist = Math.hypot(x - golCenter.x, y - golCenter.y);
                if (dist > currentRadius) {
                    finalGen.add(cell);
                }
            }
            
            // Force QR cells INSIDE the forming radius
            for (const pt of qrMatrix) {
                const dist = Math.hypot(pt.dx, pt.dy);
                if (dist <= currentRadius) {
                    finalGen.add(`${golCenter.x + pt.dx},${golCenter.y + pt.dy}`);
                }
            }
            
            golCells = finalGen;
            renderGol();
        }
        else if (golGenerations > 30 && golGenerations <= 84) { 
            // Hold for ~8 seconds
            const nextGen = calculateNextGen();
            const finalGen = new Set();
            
            const offset = Math.floor(qrCount / 2);
            // Keep simulated cells outside the QR bounding box
            for (const cell of nextGen) {
                const [xStr, yStr] = cell.split(',');
                const x = parseInt(xStr, 10);
                const y = parseInt(yStr, 10);
                if (x < golCenter.x - offset || x > golCenter.x + offset || 
                    y < golCenter.y - offset || y > golCenter.y + offset) {
                    finalGen.add(cell);
                }
            }
            
            // Force the entire QR code statically
            if (qrMatrix) {
                for (const pt of qrMatrix) {
                    finalGen.add(`${golCenter.x + pt.dx},${golCenter.y + pt.dy}`);
                }
            }
            
            golCells = finalGen;
            renderGol();
        }
        else if (golGenerations > 84 && golGenerations <= 110) {
            // Resume Game of Life using the QR code as seed!
            golCells = calculateNextGen();
            renderGol();
        }
        else if (golGenerations > 110 && golGenerations <= 124) {
            // Fading
            golCells = calculateNextGen();
            renderGol();
        }
        else {
            cleanupGol();
        }
    }
    
    function calculateNextGen() {
        const neighborCounts = new Map();
        
        for (const cell of golCells) {
            const [xStr, yStr] = cell.split(',');
            const x = parseInt(xStr, 10);
            const y = parseInt(yStr, 10);
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx < 0 || nx > window.innerWidth / gridSize || ny < 0 || ny > window.innerHeight / gridSize) continue;
                    
                    const key = `${nx},${ny}`;
                    neighborCounts.set(key, (neighborCounts.get(key) || 0) + 1);
                }
            }
        }
        
        const nextGen = new Set();
        for (const [key, count] of neighborCounts.entries()) {
            const isAlive = golCells.has(key);
            if (isAlive && (count === 2 || count === 3)) {
                nextGen.add(key);
            } else if (!isAlive && count === 3) {
                nextGen.add(key);
            }
        }
        
        return nextGen;
    }
    
    function cleanupGol() {
        for (const el of golElements.values()) el.remove();
        golElements.clear();
        golCells.clear();
        clearInterval(golInterval);
        golInterval = null;
    }
    
    function renderGol() {
        let currentOpacity = 0.6;
        if (golGenerations > 110) {
            currentOpacity = Math.max(0, 0.6 * (1 - (golGenerations - 110) / 14));
        }

        if (currentOpacity === 0) {
            cleanupGol();
            return;
        }

        for (const [key, el] of golElements.entries()) {
            if (!golCells.has(key)) {
                el.remove();
                golElements.delete(key);
            } else {
                el.style.opacity = currentOpacity;
            }
        }
        
        for (const key of golCells) {
            if (!golElements.has(key)) {
                const [xStr, yStr] = key.split(',');
                const x = parseInt(xStr, 10);
                const y = parseInt(yStr, 10);
                
                const el = document.createElement('div');
                Object.assign(el.style, {
                    position: 'fixed',
                    width: '8px', height: '8px',
                    backgroundColor: '#F3E5AB',
                    left: (x * gridSize + gridSize / 2) + 'px',
                    top: (y * gridSize + gridSize / 2) + 'px',
                    transform: 'translate(-50%, -50%)',
                    zIndex: '2147483645',
                    pointerEvents: 'none',
                    opacity: currentOpacity.toString(),
                    transition: 'opacity 0.15s linear'
                });
                document.body.appendChild(el);
                golElements.set(key, el);
            }
        }
    }
})();

// --- RESPONSIVE: recalculate artwork grid on resize ---
(function initResizeHandler() {
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Recalculate artwork cell backgrounds if image is loaded
            if (globalLoaderState && globalLoaderState.imageUrl && globalLoaderState.cells.length > 0) {
                const img = new Image();
                img.onload = () => {
                    const cols = 40;
                    const rows = 30;
                    const imgW = img.naturalWidth;
                    const imgH = img.naturalHeight;
                    const aspect = imgW / imgH;
                    const screenW = window.innerWidth;
                    const screenH = window.innerHeight;
                    const screenAspect = screenW / screenH;
                    let coverW, coverH;
                    if (screenAspect > aspect) {
                        coverW = screenW;
                        coverH = screenW / aspect;
                    } else {
                        coverH = screenH;
                        coverW = screenH * aspect;
                    }
                    
                    const coverOffsetX = (coverW - screenW) / 2;
                    const coverOffsetY = (coverH - screenH) / 2;
                    
                    const zoomLayer = document.getElementById('global-artwork-zoom-layer');
                    if (zoomLayer) {
                        zoomLayer.dataset.coverSize = `${coverW}px ${coverH}px`;
                        
                        if (document.documentElement.classList.contains('has-artwork')) {
                            zoomLayer.style.backgroundSize = `${coverW}px ${coverH}px`;
                            zoomLayer.style.backgroundPosition = 'center';
                        }
                    }
                };
                img.src = globalLoaderState.imageUrl;
            }
        }, 150);
    });
})();

