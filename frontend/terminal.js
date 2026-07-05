// Was thinking to separate out terminal but naaa, bahut kaam karba padega
// Lets see in future to add more functionalities other than terminal.

export default class Terminal{
    constructor(){
        this.currUser = "user";
        this.currentDirectory = "~/";
        this.commandRunning = false;
    }
}