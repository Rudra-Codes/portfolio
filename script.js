document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('cmd-input');
    const terminalHistory = document.getElementById('terminal-history');
    const terminalBody = document.getElementById('terminal-body');
    const inputLine = document.getElementById('input-line');
    const welcomeMessage = document.getElementById('welcome-message');
    const promptText = document.getElementById('prompt-text');
    // Templates
    // const promptTemplate = document.getElementById('prompt-template');
    const lsOutputTemplate = document.getElementById('ls-output-template');
    const cmdNotFound = document.getElementById('tpl-error');
    let inRudraShell = false;
    let botEndpoint = '';
    let currUser = "user";
    let currentDirectory = "~/";
    let commandRunning = false;
    function updateInputLine(User = currUser, Directory = currentDirectory) {
        inputLine.querySelector(".user").textContent = User;
        inputLine.querySelector(".path").textContent = Directory;
    }

    // --- Boot Sequence Typing Animation ---
    async function typeText(element, text, replacements = []) {
        let currentText = '';
        for (let i = 0; i < text.length; i++) {
            currentText += text[i];
            element.innerHTML = currentText + '<span class="cursor"></span>';
            // Randomize typing speed for realism
            const delay = 0;
            await new Promise(r => setTimeout(r, delay));
        }

        let finalHTML = text;
        for (let rep of replacements) {
            finalHTML = finalHTML.replace(rep.word, rep.tag);
        }
        element.innerHTML = finalHTML;

        await new Promise(r => setTimeout(r, 200));
    }

    async function runBootSequence() {
        if (!welcomeMessage || !inputLine) return;

        // Type the H1 title
        const h1 = document.createElement('h1');
        h1.className = 'terminal-title';
        welcomeMessage.appendChild(h1);
        await typeText(h1, 'Welcome to the Rudra Creeper Terminal');

        // Type the paragraph
        const p = document.createElement('p');
        welcomeMessage.appendChild(p);
        await typeText(p, 'Type help to see the list of available commands.', [
            { word: 'help', tag: '<span class="cmd">help</span>' }
        ]);

        // Show input and focus
        updateInputLine();
        inputLine.style.display = 'flex';
        inputField.focus();
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    runBootSequence();

    // Keep focus on input when clicking anywhere in terminal
    document.addEventListener('click', () => {
        inputField.focus();
    });

    // Map commands to template IDs
    const commands = {
        'cat about.txt': 'tpl-about',
        './show_skills.sh': 'tpl-skills',
        'grep "education" resume.md': 'tpl-education',
        'ls -la /work_experience': 'tpl-experience',
        'docker ps -a | grep "projects"': 'tpl-projects',
        'cat trophies.json': 'tpl-achievements',
        'ping contact.rudra': 'tpl-contact',
        'help': { call: runHelp, desc: "" },
        'clear': { call: runClear, desc: "" },
        'rudra': { call: enterRudraShell, desc: "" },
        'ls': { call: runLs, desc: "" },
        'cd': { call: runCd, desc: "" },
        'pwd': { call: runPwd, desc: "" },
    };
    const cmd_list = Object.keys(commands);

    const file_system = {
        '~/': {
            files: { 'about.txt': 'tpl-about', 'contact.txt': 'tpl-contact' },
            dir: ["projects/"]
        },

        '~/projects/': {
            files: { 'IITI_BOT.txt': 'tpl-projects1' },
            dir: [],
        }
    };

    function getAbsolutePath(relativePath) {
        return currentDirectory + relativePath + (relativePath.slice(-1) === '/' ? '' : '/');
    }

    function runLs(args) {
        const path = args.length === 0 ? currentDirectory : getAbsolutePath(args[0]);
        console.log(path);
        if (file_system[path]) {
            // Custom printing bcz it is differnt, if possible use alreay defined ones
            const output = lsOutputTemplate.content.cloneNode(true);
            output.getElementById('ls-dirs').textContent = file_system[path].dir.join('\t');
            output.getElementById('ls-files').textContent = Object.keys(file_system[path].files).join('\t');
            terminalHistory.appendChild(output);
        }
        else printWarning(`Rudra was unable to find ${path}: No such file or directory`);
    }

    function runCd(args) {
        const path = args.length === 0 ? currentDirectory : getAbsolutePath(args[0]);
        if (file_system[path]) {
            currentDirectory = path;
            updateInputLine();
        }
        else printWarning(`Rudra was unable to find ${path}: No such file or directory`);
    }

    function runPwd(args) {
        printDir(currentDirectory);
    }

    function runHelp(args) {
        // have to document, baad mei karenge bc
        if (args.length === 0) args = cmd_list;

    }

    function runClear(args) {
        terminalHistory.innerHTML = '';
    }

    window.updatePrompt = function () {
        if (inRudraShell) {
            document.getElementById('prompt-text').innerHTML = `<span class="bot-user" style="color: #ff5555;">rudra-ai@creeper-bot</span>:<span class="path" style="color: #ff5555;">${currentDirectory}</span>#`;
        } else {
            document.getElementById('prompt-text').innerHTML = `<span class="user">rudra@creeper</span>:<span class="path">${currentDirectory}</span>$`;
        }
    };
    // updatePrompt();

    function EchoCmd(cmdText) {

        const cmdEcho = document.createElement('div');
        cmdEcho.className = 'prompt';

        const promptClone = promptText.cloneNode(true);
        promptClone.removeAttribute('id');
        cmdEcho.appendChild(promptClone);

        const prompt = document.createElement('span');
        prompt.className = 'cmd';
        prompt.textContent = cmdText;
        cmdEcho.appendChild(prompt);
        terminalHistory.appendChild(cmdEcho);
    }

    inputField.addEventListener('keydown', async function (e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
            if (inRudraShell) {
                exitRudraShell();
                e.preventDefault();
            }
            return;
        }
        // Tab auto complete logiccc
        if (e.key === 'Tab') {
            e.preventDefault();
            // currentDirectory = "test";
            // updatePrompt();
            const input = this.value.trim();

            if (!input) return;

            const matches = cmd_list.filter(cmd =>
                cmd.startsWith(input)
            );

            if (matches.length === 1) {
                // Single match
                this.value = matches[0];
            }
            else if (matches.length > 1) {

                // Find longest common prefix
                let prefix = matches[0];

                for (let i = 1; i < matches.length; i++) {
                    while (
                        !matches[i].startsWith(prefix) &&
                        prefix.length > 0
                    ) {
                        prefix = prefix.slice(0, -1);
                    }
                }

                if (prefix.length > input.length) {
                    // Yha par usse exact match nhi mila but bada mila so de do.
                    this.value = prefix;
                } else {
                    EchoCmd(input);
                    // Show available matches without echoing prompt
                    const outputWrapper = document.createElement('div');
                    outputWrapper.className = 'output';
                    outputWrapper.style.color = '#ffff55';
                    outputWrapper.innerHTML = `<pre>${matches.join('\t')}</pre>`;
                    terminalHistory.appendChild(outputWrapper);

                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }
            }

            return;
        }
        if (e.key === 'Enter' && !commandRunning) {
            EchoCmd(this.value);
            const cmdText = this.value.trim();

            if (cmdText !== '') {
                if (inRudraShell) {
                    await handleRudraQuery(cmdText);
                } else {
                    executeCommand(cmdText);
                }
            }
            else {
                // Empty command
                const cmdEcho = document.createElement('div');
                cmdEcho.className = 'prompt';
                const promptClone = promptText.cloneNode(true);
                promptClone.removeAttribute('id');
                cmdEcho.appendChild(promptClone);
                terminalHistory.appendChild(cmdEcho);
            }

            // Clear input
            this.value = '';

            // Auto scroll to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

    async function fetchBotEndpoint() {
        if (botEndpoint) return botEndpoint;
        try {
            const response = await fetch('.env');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('BOT_ENDPOINT=')) {
                        botEndpoint = line.substring('BOT_ENDPOINT='.length).replace(/["']/g, '').trim();
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to read .env', error);
        }
        return botEndpoint;
    }

    function enterRudraShell() {
        inRudraShell = true;

        // Echo the 'rudra' command
        const cmdEcho = document.createElement('div');
        cmdEcho.className = 'prompt';
        const promptClone = promptText.cloneNode(true);
        promptClone.removeAttribute('id');
        cmdEcho.appendChild(promptClone);
        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'cmd';
        cmdSpan.textContent = 'rudra';
        cmdEcho.appendChild(cmdSpan);
        terminalHistory.appendChild(cmdEcho);

        // Show welcome message
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'output';
        welcomeMsg.style.color = '#ff5555';
        welcomeMsg.innerHTML = `<h3>> INITIALIZING RUDRA AI...</h3><p>Connection established. Type your question or press <span class="cmd" style="color:#FFFF55;">Ctrl+Q</span> to exit.</p>`;
        terminalHistory.appendChild(welcomeMsg);

        // Change prompt
        updatePrompt();
        inputField.style.color = '#ff5555'; // Change input color to match theme
    }

    function exitRudraShell() {
        inRudraShell = false;

        const exitMsg = document.createElement('div');
        exitMsg.className = 'output';
        exitMsg.style.color = '#ff5555';
        exitMsg.innerHTML = `<p>Exiting Rudra AI... Connection terminated.</p>`;
        terminalHistory.appendChild(exitMsg);

        // Restore prompt
        updatePrompt();
        inputField.style.color = '#FFFF55'; // Restore original color

        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    async function handleRudraQuery(query) {
        // Echo query
        const cmdEcho = document.createElement('div');
        cmdEcho.className = 'prompt';
        const promptClone = promptText.cloneNode(true);
        promptClone.removeAttribute('id');
        cmdEcho.appendChild(promptClone);
        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'cmd';
        cmdSpan.style.color = '#ff5555';
        cmdSpan.textContent = query;
        cmdEcho.appendChild(cmdSpan);
        terminalHistory.appendChild(cmdEcho);

        // Fetch endpoint if not loaded
        const endpoint = await fetchBotEndpoint();

        // Create thinking indicator
        const thinkingMsg = document.createElement('div');
        thinkingMsg.className = 'output';
        thinkingMsg.style.color = '#ff5555';
        thinkingMsg.innerHTML = `<p class="cursor" style="background-color: #ff5555;"></p> <span style="vertical-align: middle;">Processing data...</span>`;
        terminalHistory.appendChild(thinkingMsg);
        terminalBody.scrollTop = terminalBody.scrollHeight;

        try {
            if (!endpoint) {
                throw new Error("No BOT_ENDPOINT found in .env");
            }

            // Dummy fetch
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: query })
            });

            thinkingMsg.remove();

            const resMsg = document.createElement('div');
            resMsg.className = 'output';
            resMsg.style.color = '#ff5555';

            if (response.ok) {
                const data = await response.json();
                resMsg.innerHTML = `<p>${escapeHTML(data.answer || "I received your query but have no answer yet.")}</p>`;
            } else {
                resMsg.innerHTML = `<p>Error from the void: ${response.status} ${response.statusText}</p>`;
            }
            terminalHistory.appendChild(resMsg);

        } catch (error) {
            thinkingMsg.remove();
            const errMsg = document.createElement('div');
            errMsg.className = 'output output-error';
            // errMsg.style.color = '#ff5555';
            errMsg.innerHTML = `<p>Failed to connect to the AI mainframe. Error: ${escapeHTML(error.message)}</p>`;
            terminalHistory.appendChild(errMsg);
        }
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // --- Global Terminal Display Functions ---
    // Use these functions to display custom text or API responses in the terminal

    // 1. Display standard text
    window.printText = function (input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output';
        // outputWrapper.innerHTML = `<p>${escapeHTML(text)}</p>`;
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    };
    window.printDir = function (input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-dir';
        // outputWrapper.innerHTML = `<p>${escapeHTML(text)}</p>`;
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 2. Display success text (green)
    window.printSuccess = function (text) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-success';
        outputWrapper.innerHTML = `<p>[SUCCESS] ${escapeHTML(text)}</p>`;
        terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 3. Display error text (red)
    window.printError = function (text) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-error';
        outputWrapper.innerHTML = `<p>[ERROR] ${escapeHTML(text)}</p>`;
        terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 4. Display warning text (yellow)
    window.printWarning = function (input) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-warning';
        const text = document.createElement('span');
        text.textContent = input;
        outputWrapper.appendChild(text);
        terminalHistory.appendChild(outputWrapper);
        // terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 5. Display text with the typewriter effect
    window.printTyping = async function (text) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-typing';
        const p = document.createElement('p');
        outputWrapper.appendChild(p);
        terminalHistory.appendChild(outputWrapper);

        await typeText(p, text);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 6. Display raw HTML (useful for tables or custom layouts)
    window.printHTML = function (htmlString) {
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'output output-html';
        outputWrapper.innerHTML = htmlString;
        terminalHistory.appendChild(outputWrapper);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    // 7. Display text in an ASCII border box
    window.printBoxed = function (text) {
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
        outputWrapper.innerHTML = `<pre>${escapeHTML(boxedText)}</pre>`;
        terminalHistory.appendChild(outputWrapper);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    async function executeCommand(cmdText) {
        // assuming phele hi history mei echo kar diya.
        // Hide terminal start commands to feel like terminal
        promptText.style.visibility = 'hidden';
        commandRunning = true;
        // 1. Parse commands
        [command, ...ergs] = cmdText.split(/\s+/);
        // 2. Process command
        if (typeof commands[command]?.call === 'function') commands[command].call(ergs);
        else {
            const error = cmdNotFound.content.cloneNode(true);
            error.querySelector('.error-cmd').textContent = command;
            terminalHistory.appendChild(error);
        }
        // After execution unhide it.
        terminalBody.scrollTop = terminalBody.scrollHeight;
        promptText.style.visibility = 'visible';
        commandRunning = false;
        // if (cmdText.startsWith('cd ')) {
        //     const newDir = cmdText.substring(3).trim();
        //     if (newDir) {
        //         if (newDir === '~') {
        //             currentDirectory = '~/';
        //         } else if (newDir === '..') {
        //             let parts = currentDirectory.replace(/\/$/, '').split('/');
        //             if (parts.length > 1) {
        //                 parts.pop();
        //                 currentDirectory = parts.join('/');
        //                 if (currentDirectory === '~') currentDirectory = '~/';
        //             } else {
        //                 currentDirectory = '~/';
        //             }
        //         } else {
        //             let base = currentDirectory.replace(/\/$/, '');
        //             currentDirectory = base + '/' + newDir;
        //         }
        //         updatePrompt();
        //     }
        //     return;
        // }

        // let outputContent = '';

        // // Exact match or normalize spaces
        // const normalizedCmd = cmdText.replace(/\s+/g, ' ');

        // if (commands[normalizedCmd]) {
        //     const templateId = commands[normalizedCmd];
        //     const template = document.getElementById(templateId);
        //     if (template) {
        //         outputContent = template.innerHTML;
        //     }
        // } else {
        //     // Command not found
        //     const errorTemplate = document.getElementById('tpl-error');
        //     if (errorTemplate) {
        //         outputContent = errorTemplate.innerHTML;
        //         // Replace the placeholder with the actual command typed
        //         outputContent = outputContent.replace('<span class="error-cmd"></span>', escapeHTML(cmdText));
        //     }
        // }

        // 3. Append the output
        // if (outputContent) {
        //     const outputWrapper = document.createElement('div');
        //     outputWrapper.innerHTML = outputContent;
        //     terminalHistory.appendChild(outputWrapper);
        // }
    }

    // Helper to prevent XSS if they type HTML
    function escapeHTML(str) {
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

    // --- Combined Matrix Rain & Particle Trail Animation ---
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '01'.split('');

        // Setup Matrix Rain
        const fontSize = 14;
        let columns = Math.floor(canvas.width / fontSize);
        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        let mouse = { x: -1000, y: -1000 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // No additional particles, only matrix disturbance

        function drawCombined() {
            // Background fade for Matrix Rain
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Matrix Rain
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                if (Math.random() > 0.95) {
                    ctx.fillStyle = '#55FF55'; // Bright creeper green
                } else {
                    ctx.fillStyle = '#00AA00'; // Darker creeper green
                }

                let drawX = i * fontSize;
                let drawY = drops[i] * fontSize;

                // Matrix rain dodges the cursor, simulating disturbance
                const dx = drawX - mouse.x;
                const dy = drawY - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 80) {
                    const push = (80 - dist) * 0.5;
                    const angle = Math.atan2(dy, dx);
                    drawX += Math.cos(angle) * push;
                    drawY += Math.sin(angle) * push;
                }

                ctx.fillText(text, drawX, drawY);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            // Particles disabled - only matrix rain is disturbed
        }

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.floor(canvas.width / fontSize);
            drops.length = 0;
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
        });

        // Run at 30fps like the original matrix rain
        setInterval(drawCombined, 33);
    }
});
