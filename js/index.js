const installedApps = [
    { id: 'freq', name: 'Frequency', file: 'pages/frequencyEncoder.html' },
    { id: 'cross', name: 'Crossword', file: 'pages/crosswordGenerator.html' },
    { id: 'med', name: 'Calculator', file: 'pages/minecraftMedievalCalculator.html' },
];

let zIndex = 100;
const desktop = document.getElementById('desktop');
const taskList = document.getElementById('task-list');

function initOS() {
    installedApps.forEach(app => {
        createTaskbarItem(app);
    });
    startClock();
}


function createTaskbarItem(app) {
    const btn = document.createElement('button');
    btn.className = 'task-item';
    btn.innerText = app.name.toUpperCase();
    btn.id = `task-${app.id}`;
    
    btn.onclick = () => {
        const existingWin = document.getElementById(`win-${app.id}`);
        if (!existingWin) {
            createWindow(app);
        } else {
            toggleWindow(`win-${app.id}`, app.id);
        }
    };
    
    taskList.appendChild(btn);
}


function createWindow(app) {
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `win-${app.id}`;
    win.style.top = '50px';
    win.style.left = '50px';
    win.dataset.zoom = "1.0"; 
    
    bringToFront(win); 

    const titleBar = document.createElement('div');
    titleBar.className = 'title-bar';
    
    const titleText = document.createElement('div');
    titleText.className = 'title-text';
    titleText.innerText = app.name.toUpperCase();
    
    const controls = document.createElement('div');
    controls.className = 'controls';
    
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

    titleBar.appendChild(titleText);
    titleBar.appendChild(controls);

    const body = document.createElement('div');
    body.className = 'window-body';
    
    const iframe = document.createElement('iframe');
    iframe.src = app.file;
    iframe.id = `iframe-${app.id}`;

    body.appendChild(iframe);

    const resizer = document.createElement('div');
    resizer.className = 'resizer';

    win.appendChild(titleBar);
    win.appendChild(body);
    win.appendChild(resizer);
    desktop.appendChild(win);

    updateTaskbarState(app.id, 'open');

    makeDraggable(win, titleBar);
    makeResizable(win, resizer);
    
    win.addEventListener('mousedown', () => bringToFront(win));
}


function changeZoom(winId, step) {
    const win = document.getElementById(winId);
    const iframe = win.querySelector('iframe');
    
    let currentZoom = parseFloat(win.dataset.zoom);
    currentZoom = parseFloat((currentZoom + step).toFixed(1));

    if (currentZoom < 0.5) currentZoom = 0.5;
    if (currentZoom > 3.0) currentZoom = 3.0;

    win.dataset.zoom = currentZoom;

    try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
            iframe.contentDocument.body.style.zoom = currentZoom;
            if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
                 iframe.contentDocument.body.style.transform = `scale(${currentZoom})`;
                 iframe.contentDocument.body.style.transformOrigin = "0 0";
                 iframe.contentDocument.body.style.width = `${100/currentZoom}%`;
            }
        }
    } catch (e) { }
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
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.stopPropagation();
    });
}


function startClock() {
    function update() {
        const now = new Date();
        document.getElementById('clock').textContent = 
            now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(update, 1000);
    update();
}


initOS();