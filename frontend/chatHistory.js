export default class CommandHistory {
    constructor(limit = 50) {
        this.limit = limit;
        this.buffer = new Array(limit);
        this.start = 0; // oldest command
        this.size = 0;
        this.cursor = 0; // navigation cursor
    }

    push(command) {
        if (!command) return;

        // Optional: avoid consecutive duplicates
        if (this.size > 0 && this.last() === command) return;

        const end = (this.start + this.size) % this.limit;
        this.buffer[end] = command;

        if (this.size < this.limit) {
            this.size++;
        } else {
            // overwrite oldest
            this.start = (this.start + 1) % this.limit;
        }

        this.cursor = this.size; // reset cursor after new command
    }

    last() {
        if (this.size === 0) return null;
        return this.get(this.size - 1);
    }

    get(index) {
        if (index < 0 || index >= this.size) return null;
        return this.buffer[(this.start + index) % this.limit];
    }

    up() {
        if (this.cursor > 0) this.cursor--;
        return this.get(this.cursor);
    }

    down() {
        if (this.cursor < this.size - 1) {
            this.cursor++;
            return this.get(this.cursor);
        }

        this.cursor = this.size;
        return ""; // empty prompt
    }
}