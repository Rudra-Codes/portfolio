import loginModule from './shells/login.js';
import printCommands from './printCommands.js';
import { resumeLink } from './config.js';
import CommandHistory from './chatHistory.js';

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
    const helpTemplate = document.getElementById('tpl-help');
    let inRudraShell = false;
    let botEndpoint = '';
    let currUser = "user";
    let currentDirectory = "/";
    let commandRunning = false;
    let activeSession = null;

    const printCommand = new printCommands(terminalHistory, promptText);
    const commandHistory = new CommandHistory(50);
    const terminalCallbacks = {
        printCommand,
        updateInputLine,
        hidePrompt: () => { promptText.style.display = 'none'; },
        showPrompt: () => { promptText.style.display = ''; },
        setInputType: (type) => { inputField.type = type; },
        setActiveSession: (session) => activeSession = session
    };

    function updateInputLine(User = currUser, Directory = currentDirectory) {
        inputLine.querySelector(".user").textContent = User;
        inputLine.querySelector(".path").textContent = Directory;
    }

    // --- Boot Sequence Typing Animation ---

    async function runBootSequence() {
        if (!welcomeMessage || !inputLine) return;

        // Type the H1 title
        const h1 = document.createElement('h1');
        h1.className = 'terminal-title';
        welcomeMessage.appendChild(h1);
        await printCommand.typeText(h1, 'Welcome to the Rudra Creeper Terminal');

        // Type the feedback message
        const pFeedback = document.createElement('p');
        welcomeMessage.appendChild(pFeedback);
        await printCommand.typeText(pFeedback, 'Backend is self hosted at rudra home server, for any feedback or bug report, please mail at feedback@rudrachitkara.dev. Use tab autocomplete to explore.', [
            { word: 'feedback@rudrachitkara.dev', tag: '<a href="mailto:feedback@rudrachitkara.dev" style="color: #e3ff71ff; text-decoration: underline;">feedback@rudrachitkara.dev</a>' },
            { word: 'tab', tag: '<span class="output-error">tab</span>' }
        ]);

        // Type the paragraph
        const p = document.createElement('p');
        welcomeMessage.appendChild(p);
        await printCommand.typeText(p, 'Type help to see the list of available commands.', [
            { word: 'help', tag: '<span class="cmd" style="margin-left: 0px;">help</span>' }
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

    const sudoCommands = {
        'login': new loginModule(terminalCallbacks),
        // 'get-info': { call: runGetInfo }
    }
    // Commands jo chal sakti
    const commands = {
        // 'cat about.txt': 'tpl-about',
        // './show_skills.sh': 'tpl-skills',
        // 'grep "education" resume.md': 'tpl-education',
        // 'ls -la /work_experience': 'tpl-experience',
        // 'docker ps -a | grep "projects"': 'tpl-projects',
        // 'cat trophies.json': 'tpl-achievements',
        // 'ping contact.rudra': 'tpl-contact',
        'help': { call: runHelp, desc: "Show Legendary Help menu" },
        'clear': { call: runClear, desc: "Clear this terminal screen, not your history :)" },
        'rudra': { call: enterRudraShell, desc: "Launch the rudra AI bot if you want to know about me or anything" },
        'ls': { call: runLs, desc: "Same as linux works, show items in current Directory" },
        'cd': { call: runCd, desc: "Same as linux works, Change Directory" },
        'pwd': { call: runPwd, desc: "Same as linux works, know current absolute path" },
        'about': { call: runAbout, desc: "To view my resume" },
        'sudo': { call: runSudo, desc: "This one is special, used to interact with backend, before executing anything use sudo login. See man for more info.", subcommands: Object.keys(sudoCommands) },
    };
    const cmd_list = Object.keys(commands);

    const file_system = {
        '/': {
            files: { 'about.txt': 'tpl-about', 'contact.txt': 'tpl-contact' },
            dir: ["projects/"]
        },

        '/projects/': {
            files: { 'IITI_BOT.txt': 'tpl-projects1' },
            dir: []
        },

        '/home/user/': {
            files: { 'info.txt': 'id' },
            dir: []
        }
    };

    function getAbsolutePath(relativePath) {
        if (relativePath[0] === '/') {
            return relativePath + (relativePath.slice(-1) === '/' ? '' : '/');
        }
        if (relativePath.slice(0, 2) === '..') {
            relativePath = currentDirectory.substring(0, currentDirectory.lastIndexOf('/', currentDirectory.length - 2)) + relativePath.slice(2);
            if (!relativePath) return currentDirectory;
            return relativePath + (relativePath.slice(-1) === '/' ? '' : '/');
        }
        if (!relativePath) return currentDirectory;
        return currentDirectory + relativePath + (relativePath.slice(-1) === '/' ? '' : '/');
    }

    function runLs(args) {
        const path = args.length === 0 ? currentDirectory : getAbsolutePath(args[0]);
        // console.log(path);
        if (file_system[path]) {
            // Custom printing bcz it is differnt, if possible use alreay defined ones
            const output = lsOutputTemplate.content.cloneNode(true);
            output.getElementById('ls-dirs').textContent = file_system[path].dir.join('\t');
            output.getElementById('ls-files').textContent = Object.keys(file_system[path].files).join('\t');
            terminalHistory.appendChild(output);
        }
        else printCommand.printWarning(`Rudra was unable to find ${path}: No such file or directory`);
    }

    function runCd(args) {
        let path = args.length === 0 ? currentDirectory : getAbsolutePath(args[0]);
        // console.log(path);
        if (file_system[path]) {
            currentDirectory = path;
            updateInputLine();
        }
        else printCommand.printWarning(`Rudra was unable to find ${path}: No such file or directory`);
    }

    function runPwd(args) {
        printCommand.printDir(currentDirectory);
    }

    function runHelp(args) {
        let present = [];
        let notPresent = [];
        args.forEach(item => {
            if (commands[item]) present.push(item);
            else notPresent.push(item);
        });
        if (notPresent.length !== 0) printCommand.printError(notPresent.join(', ') + ` command${(notPresent.length > 1) ? 's' : ''} not found.`)
        if (present.length === 0) present = cmd_list;
        const template = helpTemplate.content.cloneNode(true);
        template.querySelector('ul').innerHTML = present.map(item =>
            `<li><span class="cmd">${item}</span> - ${commands[item].desc}</li>`
        ).join('\n');
        terminalHistory.appendChild(template);
    }

    function runClear(args) {
        terminalHistory.innerHTML = '';
    }

    function runSudo(args) {
        if (args.length === 0) {
            printCommand.printError("sudo: missing command");
            return;
        }
        const cmd = args[0];
        if (sudoCommands[cmd]) {
            sudoCommands[cmd].call();
        } else {
            printCommand.printError(`sudo: ${cmd}: command not found`);
        }
    }

    async function runAbout(args) {
        printCommand.printText("This will open rudra's resume in new tab.");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        printCommand.printSuccess("Opened rudra's Resume in new tab");
        window.open(resumeLink, "_blank");
    }
    // function runGetInfo()

    window.updatePrompt = function () {
        if (inRudraShell) {
            document.getElementById('prompt-text').innerHTML = `<span class="bot-user" style="color: #ff5555;">rudra-ai@creeper-bot</span>:<span class="path" style="color: #ff5555;">${currentDirectory}</span>#`;
        } else {
            document.getElementById('prompt-text').innerHTML = `<span class="user">${currUser}@creeper</span>:<span class="path">${currentDirectory}</span>$`;
        }
    };
    // updatePrompt();


    inputField.addEventListener('keydown', async function (e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            runClear();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            if (activeSession) activeSession.exit();
            else {
                printCommand.EchoCmd(this.value.trim());
                this.value = "";
            }
        }

        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
            if (inRudraShell) {
                exitRudraShell();
                e.preventDefault();
            }
            return;
        }
        // Tab auto complete logiccc
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.value = commandHistory.up();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.value = commandHistory.down();
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            if (activeSession) return;
            // currentDirectory = "test";
            // updatePrompt();
            const input = this.value.trimStart();

            // if (!input) return;

            let matches = [];
            let prefixToComplete = "";
            let replacementPrefix = "";

            const lastSpaceIndex = input.lastIndexOf(' ');

            if (lastSpaceIndex === -1) {
                // Command completion
                matches = cmd_list.filter(cmd => cmd.startsWith(input));
                prefixToComplete = input;
                replacementPrefix = "";
            } else {
                const commandPart = input.slice(0, lastSpaceIndex + 1);
                const pathPart = input.slice(lastSpaceIndex + 1);
                // pathPart = pathPart.trimStart();
                let lastCommand = commandPart.trimEnd();
                lastCommand = lastCommand.slice(lastCommand.lastIndexOf(' ') + 1);

                if (commands[lastCommand]?.subcommands) {
                    matches = commands[lastCommand].subcommands.filter(cmd => cmd.startsWith(pathPart));
                    prefixToComplete = pathPart;
                    replacementPrefix = commandPart;
                }
                else {
                    // File path completion
                    const lastSlashIndex = pathPart.lastIndexOf('/');
                    let dirPart = '';
                    prefixToComplete = pathPart;

                    if (lastSlashIndex !== -1) {
                        dirPart = pathPart.slice(0, lastSlashIndex + 1);
                        prefixToComplete = pathPart.slice(lastSlashIndex + 1);
                    }

                    let absDirPath = getAbsolutePath(dirPart);
                    // console.log(absDirPath);
                    const dirContents = file_system[absDirPath];
                    if (dirContents) {
                        const availableItems = [
                            ...Object.keys(dirContents.files || {}),
                            ...(dirContents.dir || [])
                        ];
                        matches = availableItems.filter(item => item.startsWith(prefixToComplete));
                    }
                    replacementPrefix = commandPart + dirPart;
                }
            }

            if (matches.length === 1) {
                // Single match
                this.value = replacementPrefix + matches[0];
            }
            else if (matches.length > 1) {
                // Find longest common prefix
                let commonPrefix = matches[0];

                for (let i = 1; i < matches.length; i++) {
                    while (
                        !matches[i].startsWith(commonPrefix) &&
                        commonPrefix.length > 0
                    ) {
                        commonPrefix = commonPrefix.slice(0, -1);
                    }
                }

                if (commonPrefix.length > prefixToComplete.length) {
                    // Yha par usse exact match nhi mila but bada mila so de do.
                    this.value = replacementPrefix + commonPrefix;
                } else {
                    printCommand.EchoCmd(input);
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
            const cmdText = this.value.trim();
            // Clear input
            this.value = '';
            commandHistory.push(cmdText);
            if (activeSession) await activeSession.handleInput(cmdText);
            else executeCommand(cmdText);
            // printCommand.EchoCmd(cmdText);
            // } else if (cmdText !== '') {
            //     if (inRudraShell) {
            //         await handleRudraQuery(cmdText);
            //     } else {
            //         executeCommand(cmdText);
            //     }
            // }
            // else {
            //     // Empty command
            //     const cmdEcho = document.createElement('div');
            //     cmdEcho.className = 'prompt';
            //     const promptClone = promptText.cloneNode(true);
            //     promptClone.removeAttribute('id');
            //     cmdEcho.appendChild(promptClone);
            //     terminalHistory.appendChild(cmdEcho);
            // }



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

    async function executeCommand(cmdText) {
        printCommand.EchoCmd(cmdText);
        if (cmdText === "") return;
        // Hide terminal start commands to feel like terminal
        terminalCallbacks.hidePrompt();
        commandRunning = true;
        // 1. Parse commands
        let [command, ...ergs] = cmdText.split(/\s+/);
        // 2. Process command
        if (typeof commands[command]?.call === 'function') await commands[command].call(ergs);
        else {
            const error = cmdNotFound.content.cloneNode(true);
            error.querySelector('.error-cmd').textContent = command;
            terminalHistory.appendChild(error);
        }
        // After execution unhide it.
        terminalBody.scrollTop = terminalBody.scrollHeight;
        if (!activeSession) terminalCallbacks.showPrompt();
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
