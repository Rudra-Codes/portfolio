document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('cmd-input');
    const terminalHistory = document.getElementById('terminal-history');
    const terminalBody = document.getElementById('terminal-body');

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
        'help': 'tpl-help',
    };

    inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const cmdText = this.value.trim();
            
            if (cmdText !== '') {
                executeCommand(cmdText);
            }
            
            // Clear input
            this.value = '';
            
            // Auto scroll to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

    function executeCommand(cmdText) {
        // 1. Echo the command into the history
        const cmdEcho = document.createElement('div');
        cmdEcho.className = 'prompt';
        cmdEcho.innerHTML = `<span class="user">rudra@creeper</span>:<span class="path">~</span>$ <span class="cmd">${escapeHTML(cmdText)}</span>`;
        terminalHistory.appendChild(cmdEcho);

        // 2. Process command
        if (cmdText === 'clear') {
            terminalHistory.innerHTML = '';
            return;
        }

        let outputContent = '';
        
        // Exact match or normalize spaces
        const normalizedCmd = cmdText.replace(/\s+/g, ' ');
        
        if (commands[normalizedCmd]) {
            const templateId = commands[normalizedCmd];
            const template = document.getElementById(templateId);
            if (template) {
                outputContent = template.innerHTML;
            }
        } else {
            // Command not found
            const errorTemplate = document.getElementById('tpl-error');
            if (errorTemplate) {
                outputContent = errorTemplate.innerHTML;
                // Replace the placeholder with the actual command typed
                outputContent = outputContent.replace('<span class="error-cmd"></span>', escapeHTML(cmdText));
            }
        }

        // 3. Append the output
        if (outputContent) {
            const outputWrapper = document.createElement('div');
            outputWrapper.innerHTML = outputContent;
            terminalHistory.appendChild(outputWrapper);
        }
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

    // --- Binary Particle Trail Animation ---
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '01'.split('');
        const particles = [];
        let mouse = { x: -1000, y: -1000 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            
            // Spawn particles on mouse move
            for (let i = 0; i < 3; i++) {
                particles.push(createParticle(mouse.x, mouse.y));
            }
        });

        // Spawn particles occasionally even when mouse is still
        setInterval(() => {
            if (mouse.x > 0 && mouse.y > 0) {
                particles.push(createParticle(mouse.x, mouse.y));
            }
        }, 50);

        function createParticle(x, y) {
            return {
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                text: chars[Math.floor(Math.random() * chars.length)],
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 + 0.5 // slight gravity
            };
        }

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.font = '16px monospace';
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    // Randomly flip bits
                    if (Math.random() > 0.95) {
                        p.text = chars[Math.floor(Math.random() * chars.length)];
                    }
                    
                    // Brighter green when newly spawned
                    if (p.life > 0.8) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                    } else {
                        ctx.fillStyle = `rgba(85, 255, 85, ${p.life})`;
                    }
                    
                    ctx.fillText(p.text, p.x, p.y);
                }
            }
        }

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        function animate() {
            drawParticles();
            requestAnimationFrame(animate);
        }
        animate();
    }
});
