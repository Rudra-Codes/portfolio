import shell from "../shellTemplate.js";
import { backendAPI } from "../config.js";
async function check(username, password) {
    if (username === 'rudra') {
        let sigBase64;
        try {
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
            sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
        } catch (err){
            console.log(err);
            return {detail: 'Wrong format of password, cannot parse it :('};
        }
        try {
            const response = await fetch(`${backendAPI.endpoint}/login/root`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, signature: sigBase64 }),
                signal: AbortSignal.timeout(backendAPI.timeout)
            });
            return await response.json();
        } catch (err) {
            console.log(err);
            return {detail: 'Something went wrong on backend side. Please try again.'};
        }
    }

    try {
        const response = await fetch(`${backendAPI.endpoint}/login/user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
            signal: AbortSignal.timeout(backendAPI.timeout)
        });
        return await response.json();
    } catch (err) {
        console.log(err);
        return {detail: 'Something went wrong on backend side. Please try again.'};
    }

}



export default class loginModule extends shell {
    constructor(callbacks) {
        super(callbacks);
        this.desc = 'Log in to your account.';
    }

    call(args) {
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
            // below code should never give error, if it then cap check function fucker...
            // try {
                const response = await check(this.username, input);
                if (response?.detail) {
                    this.cb.printCommand.printError(`[Error] ${response.detail}. You have ${3 - this.tries} attempts left.`);
                    if (this.tries >= 3){
                        this.cb.printCommand.printError("Too many wrong attempts");
                        this.exit();
                    }
                    // else {
                    //     this.exit();
                    //     throw new Error(`HTTP Error, status code: ${response.status}`)
                    // }
                    return;
                }
                this.cb.printCommand.printSuccess(`${this.username} have been authenticated`);
                if (response?.token) this.cb.setAuthToken(response.token);
                // console.log(response.token);
                this.cb.updateInputLine(this.username, "/");
                this.exit();

            // } catch (err) {
            //     console.log(err);
            //     this.cb.printCommand.printError("Something went wrong on server side :(");
            //     this.exit();
            // }
        }
    }

    exit() {
        this.cb.setActiveSession(null);
        this.cb.setInputType('text');
        this.cb.showPrompt();
    }
};
