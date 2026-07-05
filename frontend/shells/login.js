import shell from "../shellTemplate.js";
import { loginAPI } from "../config.js";
async function check(username, password) {
    if (username === 'rudra') {
        const binaryDer = Uint8Array.from(atob(password.trim()), c => c.charCodeAt(0));
        const privateKey = await crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            { name: "Ed25519" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "Ed25519",
            privateKey,
            new TextEncoder().encode(username)
        );
        const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

        return await fetch(`${loginAPI.endpoint}/root`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, signature: sigBase64 }),
            signal: AbortSignal.timeout(loginAPI.timeout)
        })
    }
}



export default class loginModule extends shell {
    constructor(callbacks) {
        super(callbacks);
        this.AuthToken = null;
    }

    call() {
        this.cb.setActiveSession(this);
        this.step = 0;
        this.tries = 0;
        this.username = '';
        this.cb.printCommand.printText("Do you want to login? (yes/no)");
        this.cb.hidePrompt();
    }

    async handleInput(input) {
        this.cb.printCommand.EchoCmd(this.step === 2 ? '*'.repeat(input.length) : input, false);

        if (this.step === 0) {
            if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
                this.step = 1;
                this.cb.printCommand.printText("Username: (rudra username is reserved for unlocking dev tools)");
            } else {
                this.cb.printCommand.printText("Login aborted.");
                this.exit();
            }
        } else if (this.step === 1) {
            this.username = input;
            this.step = 2;
            this.cb.setInputType('password');
            if (this.username === 'rudra') this.cb.printCommand.printText("Enter your private SSH key:")
            else this.cb.printCommand.printText("Password:");
        } else if (this.step === 2) {
            this.tries++;
            try {
                const response = await check(this.username, input);
                if (!response.ok) {
                    this.exit();
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                if (data?.verification) {
                    this.cb.printCommand.printSuccess(`${this.username} have been authenticated`);
                    if (data?.token) this.AuthToken = data.token;
                    this.cb.updateInputLine(this.username, "~/");
                    this.exit();
                }
                else if (this.tries < 4) this.cb.printCommand.printWarning(`Incorrect username or password. You have ${4 - this.tries} attempts left.`);
                else {
                    this.cb.printCommand.printError("Too many wrong attempts");
                    this.exit();
                }
            } catch (err) {
                console.log(err);
                this.cb.printCommand.printError("Wrong format of password, cannot parse it :(");
                this.exit();
            }
        }
    }

    exit() {
        this.cb.setActiveSession(null);
        this.cb.setInputType('text');
        this.cb.showPrompt();
    }
}
