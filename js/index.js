const publicPages = [
    { id: 'note', name: 'Notepad', file: 'pages/notepad.html', code: 'notepad' },
    { id: 'enq', name: 'Encoder', file: 'pages/frequencyEncoder.html', code: 'encoder' },
    { id: 'cross', name: 'Crossword', file: 'pages/crosswordGenerator.html', code: 'crossword' },
    { id: 'med', name: 'Calculator', file: 'pages/minecraftMedievalCalculator.html', code: 'calculator' },
];

const secretPages = [
    { id: 'dec', name: 'Decoder', file: 'pages/frequencyDecoder.html', unlocked: false, code: 'decoder' },
    { id: 'cmd', name: 'CMD', file: 'pages/cmd.html', unlocked: false, code: 'cmd' },
];

let pages = [];
let unlockedAppIds = [];

let zIndex = 100;
const desktop = document.getElementById('desktop');
const taskList = document.getElementById('task-list');

const launcherInput = document.getElementById('launcher-input');
const suggestionsBox = document.getElementById('launcher-suggestions');
let suggestionIndex = -1;

let timeOffset = 0;
let clockInterval = null;
let isDraggingHand = false;
let handVelocity = 0;
let lastHandAngle = 0;
let lastTimestamp = 0;
let currentDragHand = null;
let lastDigitalSecond = -1;
let hourHand, minuteHand, secondHand;
let clockCenter = { x: 0, y: 0 };
let clockRect = null;

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
let resetStartTime = null;
let offsetBeforeReset = 0;
let targetOffset = 0;


function initOS() {
    loadUnlockedApps();
    loadTimeOffset();

    pages = [...publicPages];
    secretPages.forEach(app => {
        if (unlockedAppIds.includes(app.id)) {
            app.unlocked = true;
            pages.push(app);
        }
    });

    pages.forEach(app => {
        createTaskbarItem(app);
    });

    initLauncher();
    startClock();
    loadWindows();
    createAnalogClock();
}


function loadUnlockedApps() {
    try {
        unlockedAppIds = JSON.parse(localStorage.getItem('unlocked-apps') || '[]');
    } catch (e) {
        console.error("Error loading unlocked apps:", e);
        unlockedAppIds = [];
    }
}


function loadTimeOffset() {
    timeOffset = parseFloat(localStorage.getItem('timeOffset') || '0');
    if (isNaN(timeOffset)) {
        timeOffset = 0;
    }
}


function saveTimeOffset() {
    timeOffset = timeOffset % TWELVE_HOURS_MS;
    localStorage.setItem('timeOffset', timeOffset.toString());
}


function resetTimeOffset() {
    if (resetStartTime || isDraggingHand) return;
    console.log("Resetting time offset...");
    handVelocity = 0;
    const osTime = getCurrentOSTime();
    const realTime = new Date();
    const osTimeMs = (osTime.getHours() % 12) * 3.6e6 + osTime.getMinutes() * 60000 + osTime.getSeconds() * 1000 + osTime.getMilliseconds();
    const realTimeMs = (realTime.getHours() % 12) * 3.6e6 + realTime.getMinutes() * 60000 + realTime.getSeconds() * 1000 + realTime.getMilliseconds();

    let diff = realTimeMs - osTimeMs;
    if (diff > TWELVE_HOURS_MS / 2) diff -= TWELVE_HOURS_MS;
    if (diff < -TWELVE_HOURS_MS / 2) diff += TWELVE_HOURS_MS;

    offsetBeforeReset = timeOffset;
    targetOffset = timeOffset + diff;
    resetStartTime = new Date().getTime();
}


function getCurrentOSTime() {
    return new Date(new Date().getTime() + timeOffset);
}


function updateClocks(forceDigitalUpdate = false) {
    if (resetStartTime) {
        const now = new Date().getTime();
        const elapsed = now - resetStartTime;
        const duration = 1000;

        if (elapsed >= duration) {
            timeOffset = targetOffset % TWELVE_HOURS_MS;
            resetStartTime = null;
            saveTimeOffset();
        } else {
            const t = elapsed / duration;
            const easedT = 1 - Math.pow(1 - t, 3);

            timeOffset = offsetBeforeReset + (targetOffset - offsetBeforeReset) * easedT;
        }
        forceDigitalUpdate = true;
    }

    else if (!isDraggingHand && handVelocity !== 0) {
        const now = new Date().getTime();
        const deltaT = (now - (lastTimestamp || now)) / 1000.0;
        if (deltaT > 0) {
            const angleChange = handVelocity * deltaT;

            let msChange = 0;
            if (currentDragHand === 'second') {
                msChange = angleChange * (60000 / 360);
            } else if (currentDragHand === 'minute') {
                msChange = angleChange * (3600000 / 360);
            } else if (currentDragHand === 'hour') {
                msChange = angleChange * (43200000 / 360);
            }

            timeOffset += msChange;
            handVelocity *= 0.95;

            if (Math.abs(handVelocity) < 0.1) {
                handVelocity = 0;
                currentDragHand = null;
                saveTimeOffset();
            }
            lastTimestamp = now;
        }
    }

    const osTime = getCurrentOSTime();

    if (hourHand && minuteHand && secondHand) {
        const s = osTime.getSeconds() + (osTime.getMilliseconds() / 1000);
        const m = osTime.getMinutes() + (s / 60);
        const h = osTime.getHours() + (m / 60);

        const secondsRatio = s / 60;
        const minutesRatio = m / 60;
        const hoursRatio = h / 12;

        secondHand.style.transform = `translateX(-50%) rotate(${secondsRatio * 360}deg)`;
        minuteHand.style.transform = `translateX(-50%) rotate(${minutesRatio * 360}deg)`;
        hourHand.style.transform = `translateX(-50%) rotate(${hoursRatio * 360}deg)`;
    }

    const nowSeconds = osTime.getSeconds();
    if (nowSeconds !== lastDigitalSecond || forceDigitalUpdate) {
        document.getElementById('clock').textContent =
            osTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastDigitalSecond = nowSeconds;
    }
}


function getMouseAngle(e) {
    const dx = e.clientX - clockCenter.x;
    const dy = e.clientY - clockCenter.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
}


function startDrag(e, hand) {
    e.preventDefault();
    isDraggingHand = true;
    currentDragHand = hand;
    handVelocity = 0;

    const clock = document.querySelector('.analog-clock');
    clockRect = clock.getBoundingClientRect();
    clockCenter.x = clockRect.left + clockRect.width / 2;
    clockCenter.y = clockRect.top + clockRect.height / 2;

    lastHandAngle = getMouseAngle(e);
    lastTimestamp = new Date().getTime();

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}


function onDrag(e) {
    if (!isDraggingHand) return;

    const currentAngle = getMouseAngle(e);
    let angleDelta = currentAngle - lastHandAngle;

    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;

    const now = new Date().getTime();
    const timeDelta = now - lastTimestamp;

    if (timeDelta > 0) {
        handVelocity = (angleDelta / timeDelta) * 1000;

        const MAX_VELOCITY = 720;
        handVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, handVelocity));
    }

    let msChange = 0;
    if (currentDragHand === 'second') {
        msChange = angleDelta * (60000 / 360);
    } else if (currentDragHand === 'minute') {
        msChange = angleDelta * (3600000 / 360);
    } else if (currentDragHand === 'hour') {
        msChange = angleDelta * (43200000 / 360);
    }

    timeOffset += msChange;

    updateClocks(true);

    lastHandAngle = currentAngle;
    lastTimestamp = now;
}


function endDrag(e) {
    isDraggingHand = false;

    const now = new Date().getTime();
    const timeSinceLastMove = now - lastTimestamp;

    if (timeSinceLastMove > 50) {
        handVelocity = 0;
    }

    if (handVelocity === 0) {
        saveTimeOffset();
        currentDragHand = null;
    }

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
}


function initLauncher() {
    launcherInput.addEventListener('input', () => {
        const value = launcherInput.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        suggestionIndex = -1;

        if (!value) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const matchingApps = pages.filter(app =>
            (app.code && app.code.startsWith(value))
        );

        matchingApps.forEach((app, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = app.code;
            item.dataset.code = app.code;
            item.dataset.index = index;

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handleLaunch(item.dataset.code);
            });

            suggestionsBox.appendChild(item);
        });

        suggestionsBox.style.display = matchingApps.length > 0 ? 'block' : 'none';
    });

    launcherInput.addEventListener('keydown', (e) => {
        const items = suggestionsBox.querySelectorAll('.suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (suggestionIndex < items.length - 1) {
                suggestionIndex++;
                updateSuggestionHighlight(items);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (suggestionIndex > 0) {
                suggestionIndex--;
                updateSuggestionHighlight(items);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            let codeToLaunch;
            if (suggestionIndex !== -1 && items[suggestionIndex]) {
                codeToLaunch = items[suggestionIndex].dataset.code;
            } else {
                codeToLaunch = launcherInput.value;
            }
            handleLaunch(codeToLaunch);
        } else if (e.key === 'Escape') {
            clearLauncher();
        }
    });

    launcherInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== launcherInput) {
                suggestionsBox.style.display = 'none';
                suggestionIndex = -1;
            }
        }, 150);
    });
}

function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
        if (index === suggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function clearLauncher() {
    launcherInput.value = '';
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
    suggestionIndex = -1;
}


function handleLaunch(code) {
    const term = code.toLowerCase().trim();
    if (!term) return;

    let appToLaunch = pages.find(app =>
        (app.code && app.code === term)
    );

    if (appToLaunch) {
        launchApp(appToLaunch);
        clearLauncher();
        return;
    }

    let secretApp = secretPages.find(app => !app.unlocked && app.code === term);

    if (secretApp) {
        unlockApp(secretApp);
        clearLauncher();
        return;
    }

    console.log(`Code not recognized: ${term}`);
    clearLauncher();
}


function launchApp(app) {
    const winId = `win-${app.id}`;
    const existingWin = document.getElementById(winId);

    if (!existingWin) {
        createWindow(app);
    } else {
        toggleWindow(winId, app.id);
    }
}


function unlockApp(app) {
    console.log(`Unlocking app: ${app.name}`);

    app.unlocked = true;
    pages.push(app);

    if (!unlockedAppIds.includes(app.id)) {
        unlockedAppIds.push(app.id);
        localStorage.setItem('unlocked-apps', JSON.stringify(unlockedAppIds));
    }

    createTaskbarItem(app);

    launchApp(app);
}


function createAnalogClock() {
    const clockContainer = document.createElement('div');
    clockContainer.className = 'analog-clock';
    clockContainer.style.userSelect = 'none';

    clockContainer.innerHTML = `
        <div class="hand hour-hand" data-hand="hour"></div>
        <div class="hand minute-hand" data-hand="minute"></div>
        <div class="hand second-hand" data-hand="second"></div>
        <div class="clock-center"></div>
    `;

    desktop.appendChild(clockContainer);

    hourHand = clockContainer.querySelector('[data-hand="hour"]');
    minuteHand = clockContainer.querySelector('[data-hand="minute"]');
    secondHand = clockContainer.querySelector('[data-hand="second"]');

    hourHand.addEventListener('mousedown', (e) => startDrag(e, 'hour'));
    minuteHand.addEventListener('mousedown', (e) => startDrag(e, 'minute'));
    secondHand.addEventListener('mousedown', (e) => startDrag(e, 'second'));
}


function loadWindows() {
    const allPossibleApps = [...publicPages, ...secretPages];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('win-')) {
            try {
                const appId = key.substring(4);
                const app = allPossibleApps.find(a => a.id === appId);

                if (app && pages.find(p => p.id === appId)) {
                    const savedState = JSON.parse(localStorage.getItem(key));
                    if (savedState) {
                        createWindow(app, savedState);
                    }
                } else if (app) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error("Error loading window state:", e);
                localStorage.removeItem(key);
            }
        }
    }
}


function createTaskbarItem(app) {
    const btn = document.createElement('button');
    btn.className = 'task-item';
    btn.innerText = app.name.toUpperCase();
    btn.id = `task-${app.id}`;

    btn.onclick = () => {
        launchApp(app);
    };

    taskList.appendChild(btn);
}


function createWindow(app, savedState = null) {
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `win-${app.id}`;

    const state = savedState || {};
    win.style.top = state.top || '50px';
    win.style.left = state.left || '50px';
    win.style.width = state.width || '800px';
    win.style.height = state.height || '600px';
    win.dataset.zoom = state.zoom || "1.0";

    bringToFront(win);

    const titleBar = document.createElement('div');
    titleBar.className = 'title-bar';

    const titleText = document.createElement('div');
    titleText.className = 'title-text';
    titleText.innerText = app.name.toUpperCase();

    const controls = document.createElement('div');
    controls.className = 'controls';

    // --- MODIFICATION START ---
    if (app.id === 'cmd') {
      // Special controls for CMD (no zoom, no resize)
      controls.innerHTML = `
        <button onclick="minimizeWindow('win-${app.id}', '${app.id}')" title="Minimize">
            <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
        </button>
        <button onclick="toggleMaximize('win-${app.id}')" title="Maximize">
            <svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z" /></svg>
        </button>
        <button onclick="closeWindow('win-${app.id}', '${app.id}')" title="Close">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      `;
    } else {
      // Standard controls for all other apps
      controls.innerHTML = `
        <button onclick="changeZoom('win-${app.id}', -0.1)" title="Zoom Out">
            <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
        </button>
        <button onclick="changeZoom('win-${app.id}', 0.1)" title="Zoom In">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        
        <div class="separator"></div>
        
        <button onclick="minimizeWindow('win-${app.id}', '${app.id}')" title="Minimize">
            <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
        </button>
        <button onclick="toggleMaximize('win-${app.id}')" title="Maximize">
            <svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z" /></svg>
        </button>
        <button onclick="closeWindow('win-${app.id}', '${app.id}')" title="Close">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      `;
    }
    // --- MODIFICATION END ---

    titleBar.appendChild(titleText);
    titleBar.appendChild(controls);

    const body = document.createElement('div');
    body.className = 'window-body';

    const iframe = document.createElement('iframe');
    iframe.src = app.file;
    iframe.id = `iframe-${app.id}`;

    iframe.onload = () => {
      // Only apply zoom if it's NOT the cmd app
      if (app.id !== 'cmd') {
        applyZoom(win.id, 0);
      }
    };

    body.appendChild(iframe);

    // --- MODIFICATION START ---
    // Only add resizer if it's not the CMD app
    let resizer;
    if (app.id !== 'cmd') {
      resizer = document.createElement('div');
      resizer.className = 'resizer';
      win.appendChild(resizer);
    }
    // --- MODIFICATION END ---

    win.appendChild(titleBar);
    win.appendChild(body);
    // resizer is appended conditionally above
    desktop.appendChild(win);

    updateTaskbarState(app.id, 'open');

    makeDraggable(win, titleBar);
    
    // --- MODIFICATION START ---
    // Only make resizable if it's not the CMD app
    if (app.id !== 'cmd' && resizer) {
      makeResizable(win, resizer);
    }
    // --- MODIFICATION END ---

    win.addEventListener('mousedown', () => bringToFront(win));

    if (savedState === null) {
        saveWindowState(win.id);
    }
}


function saveWindowState(winId) {
    const win = document.getElementById(winId);
    if (!win || win.getAttribute('data-maximized')) {
        return;
    }

    const state = {
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
        zoom: win.dataset.zoom || "1.0"
    };

    localStorage.setItem(winId, JSON.stringify(state));
}


function applyZoom(winId, zoomStep) {
    const win = document.getElementById(winId);
    if (!win) return;

    // --- MODIFICATION START ---
    // Don't apply zoom to CMD app
    const appId = win.id.substring(4);
    if (appId === 'cmd') return;
    // --- MODIFICATION END ---
    
    const iframe = win.querySelector('iframe');

    let currentZoom = parseFloat(win.dataset.zoom);
    currentZoom = parseFloat((currentZoom + zoomStep).toFixed(1));

    if (currentZoom < 0.5) currentZoom = 0.5;
    if (currentZoom > 3.0) currentZoom = 3.0;

    win.dataset.zoom = currentZoom;

    try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
            iframe.contentDocument.body.style.zoom = currentZoom;
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                iframe.contentDocument.body.style.transform = `scale(${currentZoom})`;
                iframe.contentDocument.body.style.transformOrigin = "0 0";
                iframe.contentDocument.body.style.width = `${100 / currentZoom}%`;
            }
        }
    } catch (e) {
        console.warn("Could not apply zoom to iframe:", e.message);
    }
}


function changeZoom(winId, step) {
    applyZoom(winId, step);
    saveWindowState(winId);
}


function toggleWindow(winId, appId) {
    const win = document.getElementById(winId);
    if (win.style.display === 'none') {
        win.style.display = 'flex';
        bringToFront(win);
        updateTaskbarState(appId, 'open');
    } else {
        if (parseInt(win.style.zIndex) === zIndex) {
            minimizeWindow(winId, appId);
        } else {
            bringToFront(win);
        }
    }
}


function minimizeWindow(winId, appId) {
    const win = document.getElementById(winId);
    win.style.display = 'none';
    updateTaskbarState(appId, 'minimized');
}


function closeWindow(winId, appId) {
    const win = document.getElementById(winId);
    if (win) {
        win.remove();
    }
    updateTaskbarState(appId, 'closed');
    localStorage.removeItem(winId);
}


function toggleMaximize(id) {
    const win = document.getElementById(id);
    if (!win.getAttribute('data-maximized')) {
        win.setAttribute('data-prev-w', win.style.width);
        win.setAttribute('data-prev-h', win.style.height);
        win.setAttribute('data-prev-t', win.style.top);
        win.setAttribute('data-prev-l', win.style.left);
        win.style.width = "100%";
        win.style.height = "100%";
        win.style.top = "0";
        win.style.left = "0";
        win.setAttribute('data-maximized', 'true');
    } else {
        win.style.width = win.getAttribute('data-prev-w') || "800px";
        win.style.height = win.getAttribute('data-prev-h') || "600px";
        win.style.top = win.getAttribute('data-prev-t') || "50px";
        win.style.left = win.getAttribute('data-prev-l') || "50px";
        win.removeAttribute('data-maximized');
    }
}


function bringToFront(win) {
    zIndex++;
    win.style.zIndex = zIndex;
}


function updateTaskbarState(appId, state) {
    const btn = document.getElementById(`task-${appId}`);
    if (!btn) return;

    btn.classList.remove('open', 'minimized');

    if (state === 'open') {
        btn.classList.add('open');
    } else if (state === 'minimized') {
        btn.classList.add('minimized');
    }
}


function makeDraggable(win, handle) {
    handle.addEventListener('mousedown', (e) => {

        if (e.target.closest('button')) {
            return;
        }

        e.preventDefault();
        win.classList.add('interacting');
        win.classList.add('dragging');

        if (clockRect) {
            document.querySelector('.analog-clock').style.pointerEvents = 'none';
        }

        let startX = e.clientX;
        let startY = e.clientY;
        let startLeft = win.offsetLeft;
        let startTop = win.offsetTop;

        if (win.getAttribute('data-maximized')) {
            const mouseRatio = e.clientX / win.offsetWidth;
            toggleMaximize(win.id);
            const newWidth = win.offsetWidth;

            startLeft = e.clientX - (newWidth * mouseRatio);
            startTop = 0;

            win.style.left = startLeft + 'px';
            win.style.top = startTop + 'px';
        }

        function onMouseMove(e) {
            win.style.left = `${startLeft + e.clientX - startX}px`;
            win.style.top = `${startTop + e.clientY - startY}px`;
        }

        function onMouseUp() {
            win.classList.remove('interacting');
            win.classList.remove('dragging');

            if (clockRect) {
                document.querySelector('.analog-clock').style.pointerEvents = 'auto';
            }

            saveWindowState(win.id);

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}


function makeResizable(win, handle) {
    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        win.classList.add('interacting');
        if (clockRect) {
            document.querySelector('.analog-clock').style.pointerEvents = 'none';
        }

        let isResizing = true;
        let startX = e.clientX;
        let startY = e.clientY;
        let startW = parseInt(document.defaultView.getComputedStyle(win).width, 10);
        let startH = parseInt(document.defaultView.getComputedStyle(win).height, 10);

        function onMouseMove(e) {
            if (!isResizing) return;
            win.style.width = (startW + e.clientX - startX) + 'px';
            win.style.height = (startH + e.clientY - startY) + 'px';
        }

        function onMouseUp() {
            isResizing = false;
            win.classList.remove('interacting');

            if (clockRect) {
                document.querySelector('.analog-clock').style.pointerEvents = 'auto';
            }

            saveWindowState(win.id);

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.stopPropagation();
    });
}


function startClock() {
    clockInterval = setInterval(updateClocks, 50);
    updateClocks(true);

    document.getElementById('clock').addEventListener('dblclick', resetTimeOffset);
}


initOS();