export default class shell {
    constructor(terminalCallbacks) {
        this.cb = terminalCallbacks
        this.step = 0;
    }

    call() {
        this.callbacks.setActiveSession(null);
    }
    exit (){
        this.callbacks.setActiveSession(null);
    }
    async handleInput(input) {}
    autocomplete(input) {}
}