import shell from "../shellTemplate.js";
import { backendAPI } from "../config.js";

async function check(username, email) {
    try {
        const response = await fetch(`${backendAPI.endpoint}/check-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email }),
            signal: AbortSignal.timeout(backendAPI.timeout)
        });
        return await response.json();
    } catch (err) {
        console.log(err);
        return {detail: 'Something went wrong on backend side.'};
    }

}
async function signup(user_details) {
    try {
        const response = await fetch(`${backendAPI.endpoint}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user_details),
            signal: AbortSignal.timeout(backendAPI.timeout)
        });
        return await response.json();
    } catch (err) {
        console.log(err);
        return {detail: 'Something went wrong on backend side.'};
    }

}
async function verifyUser(username, otp) {
    try {
        const response = await fetch(`${backendAPI.endpoint}/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, otp }),
            signal: AbortSignal.timeout(backendAPI.timeout)
        });
        return await response.json();
    } catch (err) {
        console.log(err);
        return {detail: 'Something went wrong on backend side.'};
    }
}

// Commenting this bcz it has error of not printing command questions on fallback.


// export default class signupModule extends shell {
//     constructor(callbacks) {
//         super(callbacks);
//     }
//     empty_error(input, fallbackStep = 0, exit = true){
//         if (input) return false;
//         this.cb.printCommand.printError('This is not optional, please enter required value.');
//         this.step = fallbackStep;
//         if (exit) this.exit();
//         return true;
//     }
//     call() {
//         this.cb.setActiveSession(this);
//         this.step = 0;
//         this.details = {username: '', email: '', name: '', password: '', phone: '', member_type: '', department: ''};
//         this.cb.printCommand.printText("Do you want to signup? (yes/no)");
//         this.cb.hidePrompt();
//     }
//     async handleInput(input) {
//         this.cb.printCommand.EchoCmd(this.step === 4 ? '*'.repeat(input.length) : input, false);

//         switch (this.step) {
//             case 0:
//                 if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
//                     this.step = 1;
//                     this.cb.printCommand.printText("Username: (rudra username is reserved for unlocking dev tools)");
//                 } else {
//                     this.cb.printCommand.printWarning("Login aborted.");
//                     this.exit();
//                 }
//                 break;

//             case 1:
//                 if (this.empty_error(input, 1, false)) return;
//                 this.details.username = input;
//                 this.step = 2;
//                 this.cb.printCommand.printText("Enter Email Address: ");
//                 break;

//             case 2:
//                 if (this.empty_error(input, 2, false)) return;
//                 this.details.email = input;
//                 let response = await check(this.details.username, this.details.email);
//                 if (response?.detail) {
//                     this.cb.printCommand.printError(response.detail + ' Please try again.');
//                     this.step = 1;
//                 } else {
//                     this.cb.printCommand.printText('Enter your name: ');
//                     this.step = 3;
//                 }
//                 break;

//             case 3:
//                 if (this.empty_error(input, 3, false)) return;
//                 this.details.name = input;
//                 this.step = 4;
//                 this.cb.setInputType('password');
//                 this.cb.printCommand.printText("Password:");
//                 break;

//             case 4:
//                 if (this.empty_error(input, 4, false)) return;
//                 this.details.password = input;
//                 this.cb.setInputType('text');
//                 this.step = 5;
//                 this.cb.printCommand.printText("Enter your phone number (Optinal, leave blank): ");
//                 break;

//             case 5:
//                 if (!input) input = null;
//                 this.details.phone = input;
//                 this.step = 6;
//                 this.cb.printCommand.printText("Are you IIT Indore member (Student/Faculty)? Else leave it blank. : ");
//                 break;
//             case 6:
//                 if (!input) input = null;
//                 this.details.member_type = input;
//                 this.step = 7;
//                 this.cb.printCommand.printText("Your department? (Optional) : ");
//                 break;
//             case 7:
//                 if (!input) input = null;
//                 this.details.department = input;
//                 response = await signup(this.details);
//                 if (response?.detail){
//                     this.cb.printCommand.printError(response.detail + ' Please try again');
//                 }
//                 else {
//                     this.cb.printCommand.printSuccess('Signup successfull !!!');
//                     this.cb.printCommand.printText('Please verify by otp sent to your email using sudo verify-email command.');
//                 }
//                 this.exit();
//                 break;
//             default :
//                 this.exit();
//         }
//     }

//     exit() {
//         this.cb.setActiveSession(null);
//         this.cb.setInputType('text');
//         this.cb.showPrompt();
//     }
// };

export default class signupModule extends shell {
    constructor(callbacks) {
        super(callbacks);
        this.success = false;
        this.questions = {
            0: "Do you want to signup? (yes/no)",
            1: "Username: (rudra username is reserved for unlocking dev tools)",
            2: "Enter Email Address:",
            3: "Enter your name:",
            4: "Password:",
            5: "Enter your phone number (Optional, leave blank):",
            6: "Are you IIT Indore member (Student/Faculty)? Else leave it blank:",
            7: "Your department? (Optional):"
        };
        this.desc = 'Create a new user account.';
    }

    printQuestion(step = this.step) {
        this.cb.printCommand.printText(this.questions[step]);
    }

    empty_error(input, fallbackStep = this.step, exit = false) {
        if (input) return false;

        this.cb.printCommand.printError(
            "This is not optional, please enter required value."
        );
        if (exit) this.exit();
        else {
            this.step = fallbackStep;
            this.printQuestion();
        }

        return true;
    }

    async call(args) {
        this.cb.setActiveSession(this);
        this.step = 0;
        if (this.success){
            this.cb.printCommand.printWarning('Earlier signed in credentials found, deleting them...');
            const response = await fetch(
            `${backendAPI.endpoint}/pending-user/${encodeURIComponent(this.details.username)}`,
            {
                method: "DELETE",
                signal: AbortSignal.timeout(backendAPI.timeout)
            }
            );
            this.success = false;
        }
        this.details = {
            username: null,
            email: null,
            name: null,
            password: null,
            phone: null,
            member_type: null,
            department: null,
        };

        this.printQuestion();
        this.cb.hidePrompt();
    }

    async handleInput(input) {
        this.cb.printCommand.EchoCmd(this.step === 4 ? "*".repeat(input.length) : input, false);
        let response;
        switch (this.step) {
            case 0:
                if (["yes", "y"].includes(input.toLowerCase())) {
                    this.step = 1;
                    this.printQuestion();
                } else {
                    this.cb.printCommand.printWarning("Signup aborted.");
                    this.exit();
                }
                break;

            case 1:
                if (this.empty_error(input)) return;

                this.details.username = input;
                this.step = 2;
                this.printQuestion();
                break;

            case 2:
                if (this.empty_error(input)) return;

                this.details.email = input;
                response = await check(this.details.username,this.details.email);

                if (response?.detail) {
                    this.cb.printCommand.printError(
                        response.detail + " Please try again."
                    );
                    this.step = 1;
                } 
                else this.step = 3;

                this.printQuestion();
                break;

            case 3:
                if (this.empty_error(input)) return;

                this.details.name = input;
                this.step = 4;
                this.cb.setInputType("password");
                this.printQuestion();
                break;

            case 4:
                if (this.empty_error(input)) return;

                this.details.password = input;
                this.cb.setInputType("text");
                this.step = 5;
                this.printQuestion();
                break;

            case 5:
                this.details.phone = input || null;
                this.step = 6;
                this.printQuestion();
                break;

            case 6:
                this.details.member_type = input || null;
                this.step = 7;
                this.printQuestion();
                break;

            case 7:
                this.details.department = input || null;
                
                response = await signup(this.details);

                if (response?.detail) this.cb.printCommand.printError(response.detail);
                else {
                    this.cb.printCommand.printSuccess("Data staged for otp verification!!!");
                    this.cb.printCommand.printText("Please verify by OTP sent to your email using sudo verify-email command.");
                    this.cb.printCommand.printWarning('Running again sudo signup command will erase staged data for verification')
                    this.success = true;
                }
                this.exit();
                
                break;

            default:
                this.exit();
        }
    }

    exit() {
        this.cb.setActiveSession(null);
        this.cb.setInputType("text");
        this.cb.showPrompt();
    }
};

export class VerifyModule extends shell{
    constructor(callbacks) {
        super(callbacks);
        this.questions = {
            0: "Do you want to verify otp? (yes/no)",
            1: "Enter staged Username:",
            2: "Enter OTP:",
        };

        this.desc = 'Verify your email address using the provided OTP.';
    }

    printQuestion(step = this.step) {
        this.cb.printCommand.printText(this.questions[step]);
    }

    empty_error(input, fallbackStep = this.step, exit = false) {
        if (input) return false;

        this.cb.printCommand.printError(
            "This is not optional, please enter required value."
        );
        if (exit) this.exit();
        else {
            this.step = fallbackStep;
            this.printQuestion();
        }

        return true;
    }

    async call(args) {
        this.cb.setActiveSession(this);
        this.step = 0;
        this.username = null;
        this.otp = null;

        this.printQuestion();
        this.cb.hidePrompt();
    }

    async handleInput(input) {
        this.cb.printCommand.EchoCmd(this.step === 4 ? "*".repeat(input.length) : input, false);
        let response;
        switch (this.step) {
            case 0:
                if (["yes", "y"].includes(input.toLowerCase())) {
                    this.step = 1;
                    this.printQuestion();
                } else {
                    this.cb.printCommand.printWarning("Signup aborted.");
                    this.exit();
                }
                break;

            case 1:
                if (this.empty_error(input)) return;

                this.username = input;
                this.step = 2;
                this.printQuestion();
                break;

            case 2:
                if (this.empty_error(input)) return;

                this.otp = input;
                response = await verifyUser(this.username, this.otp);

                if (response?.detail) {
                    this.cb.printCommand.printError(response.detail + " Please try again.");
                    this.step = 1;
                    this.printQuestion();
                    return;
                } 
                this.cb.printCommand.printBoxed('Email verified successfull. Please log in using sudo login.');
                this.exit();
                break;
            default:
                this.exit();
        }
        
    }
    exit() {
        this.cb.setActiveSession(null);
        // this.cb.setInputType("text");
        this.cb.showPrompt();
    }
}