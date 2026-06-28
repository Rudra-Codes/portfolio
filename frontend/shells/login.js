export default class loginModule {
    constructor(callbacks) {
        this.active = false;
        this.step = 0;
        this.username = '';
        this.cb = callbacks;
        this.printCommand = callbacks.printCommand;
    }

    start() {
        this.active = true;
        this.step = 0;
        this.printCommand.printText("Do you want to login? (yes/no)");
        this.cb.hidePrompt();
    }

    handleInput(input) {
        if (this.step === 0) {
            if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
                this.step = 1;
                this.printCommand.printText("Username:");
            } else {
                this.printCommand.printText("Login aborted.");
                this.exit();
            }
        } else if (this.step === 1) {
            this.username = input;
            this.step = 2;
            this.cb.setInputType('password');
            this.printCommand.printText("Password:");
        } else if (this.step === 2) {
            if (this.username === 'admin' && input === 'admin') {
                this.printCommand.printSuccess(`Login successful. Welcome, ${this.username}.`);
                this.cb.onLoginSuccess(this.username);
            } else {
                this.printCommand.printError("Authentication failure");
            }
            this.exit();
        }
    }

    isPasswordStep() {
        return this.active && this.step === 2;
    }

    exit() {
        this.active = false;
        this.username = '';
        this.step = 0;
        this.cb.setInputType('text');
        this.cb.showPrompt();
    }
}
