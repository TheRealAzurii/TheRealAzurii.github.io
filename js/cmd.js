
const container = document.getElementById('cmd-container');
const output = document.getElementById('cmd-output');
const input = document.getElementById('cmd-input');
const inputLine = document.getElementById('cmd-input-line');

const commandHistory = [];
const MAX_HISTORY = 10;
let historyIndex = -1;
let tempInput = "";

const MAX_LINES = 100;

const headerHTML = `<p>Mock OS [Version 1.0.0]</p><p>(c) 2025 Mock OS Corporation. All rights reserved.</p><br>`;

function resetTerminal() {
    while (output.firstChild && output.firstChild !== inputLine) {
        output.removeChild(output.firstChild);
    }
}


function addOutputLine(html) {
    output.insertBefore(html, inputLine);

    trimOutputLines();
}


function trimOutputLines() {
    while (output.childElementCount > MAX_LINES + 1) {
        if (output.firstChild !== inputLine) {
            output.removeChild(output.firstChild);
        } else {
            break;
        }
    }
}


output.insertAdjacentHTML('afterbegin', headerHTML);

container.addEventListener('click', (e) => {
    if (window.getSelection().type !== 'Range') {
        input.focus();
    }
});


input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        const commandText = input.value.trim();
        const command = commandText.toLowerCase();

        if (commandText) {
            commandHistory.push(commandText);
            if (commandHistory.length > MAX_HISTORY) {
                commandHistory.shift();
            }
        }
        historyIndex = -1;
        tempInput = "";

        const promptElement = document.createElement('p');
        const promptSpan = document.createElement('span');
        promptSpan.id = 'cmd-prompt';
        promptSpan.textContent = 'C:>';
        promptElement.appendChild(promptSpan);
        promptElement.appendChild(document.createTextNode(commandText));
        addOutputLine(promptElement);

        if (command === 'clear') {
            resetTerminal();
        } else if (command.length > 0) {

        }

        input.value = '';
        output.scrollTop = output.scrollHeight;

    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            if (historyIndex === -1) {
                tempInput = input.value;
                historyIndex = commandHistory.length - 1;
            } else if (historyIndex > 0) {
                historyIndex--;
            }
            input.value = commandHistory[historyIndex];
            moveCursorToEnd();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex !== -1) {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                input.value = tempInput;
            }
            moveCursorToEnd();
        }
    }
});


function moveCursorToEnd() {
    setTimeout(() => {
        input.selectionStart = input.selectionEnd = input.value.length;
    }, 0);
}


input.focus();