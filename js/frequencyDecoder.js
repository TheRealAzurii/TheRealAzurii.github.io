const messageInput = document.getElementById('message-input');
const decodeButton = document.getElementById('decode-button');
const resultsArea = document.getElementById('decoder-results');

decodeButton.addEventListener('click', () => {
    const text = messageInput.value.trim().toLowerCase().replace(/\s+/g, '');
    if (!text) { return; }
    if (text.length < 2) { return; }

    resultsArea.innerHTML = 'Decoding...';
    
    const decodedMessages = [];

    for (let freq = 2; freq <= Math.floor(text.length / 2); freq++) {
        const decodedString = decodeByFrequency(text, freq);
        if (decodedString) {
            decodedMessages.push({ freq, text: decodedString });
        }
    }
    
    renderResults(decodedMessages);
});


function decodeByFrequency(text, freq) {
    let result = "";
    let pos = freq - 1;
    
    while (pos < text.length) {
        result += text[pos];
        pos += freq;
    }
    
    return result;
}

function renderResults(results) {
    if (results.length === 0) { return; }
    
    const resultsHTML = results.map(r => {
        return `
            <div class="result-item">
                <span class="result-freq">Freq ${r.freq}:</span>
                <span class="result-text">${r.text}</span>
            </div>
        `;
    }).join('');
    
    resultsArea.innerHTML = resultsHTML;
}