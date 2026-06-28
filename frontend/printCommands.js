// --- Global Terminal Display Functions ---
// Use these functions to display custom text or API responses in the terminal

export default class printCommands {
    constructor(historyElement) {
        this.terminalHistory = historyElement;
    }
    escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
    // 1. Display standard text
    printText(input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output';
        // outputWrapper.innerHTML = `<p>${escapeHTML(text)}</p>`;
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    printDir(input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-dir';
        // outputWrapper.innerHTML = `<p>${escapeHTML(text)}</p>`;
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 2. Display success text (green)
    printSuccess(input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-success';
        outputWrapper.innerHTML = `<p>[SUCCESS] ${this.escapeHTML(input)}</p>`;
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 3. Display error text (red)
    printError(input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-error';
        const text = document.createElement('span');
        text.textContent = 'Rudra: ' + input;
        outputWrapper.appendChild(text);
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 4. Display warning text (yellow)
    printWarning(input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-warning';
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 5. Display text with the typewriter effect
    async typeText(element, text, replacements = []) {
        let currentText = '';
        for (let i = 0; i < text.length; i++) {
            currentText += text[i];

            let displayHTML = currentText;
            for (let rep of replacements) {
                displayHTML = displayHTML.replace(rep.word, rep.tag);
            }

            element.innerHTML = displayHTML + '<span class="cursor"></span>';
            // Randomize typing speed for realism
            const delay = 10;
            await new Promise(r => setTimeout(r, delay));
        }

        let finalHTML = text;
        for (let rep of replacements) {
            finalHTML = finalHTML.replace(rep.word, rep.tag);
        }
        element.innerHTML = finalHTML;

        await new Promise(r => setTimeout(r, 200));
    }

    async printTyping(text) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-typing';
        const p = document.createElement('p');
        outputWrapper.appendChild(p);
        this.terminalHistory.appendChild(outputWrapper);

        await this.typeText(p, text);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 6. Display raw HTML (useful for tables or custom layouts)
    printHTML(htmlString) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-html';
        outputWrapper.innerHTML = htmlString;
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // 7. Display text in an ASCII border box
    printBoxed(text) {
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map(l => l.length));
        const border = '+' + '-'.repeat(maxLength + 2) + '+';

        let boxedText = border + '\n';
        for (const line of lines) {
            boxedText += '| ' + line.padEnd(maxLength, ' ') + ' |\n';
        }
        boxedText += border;

        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-boxed';
        outputWrapper.innerHTML = `<pre>${this.escapeHTML(boxedText)}</pre>`;
        this.terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    }
}