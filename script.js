
const BLANK = "B";

let tape = [];
let head = 0;
let currentState = "";
let stepCount = 0;
let selectedMachine = null;
let stopped = true;
let history = [];


const machines = {

    // MACHINE 1: EVEN NUMBER OF ZEROS
    even: {

        name: "Binary Even-Zero Checker",

        initial: "q0",

        accept: ["qAccept"],

        reject: ["qReject"],

        alphabet: ["0", "1"],

        transitions: {

            "q0,0": ["q1", "0", "R"],
            "q0,1": ["q0", "1", "R"],
            "q0,B": ["qAccept", "B", "R"],

            "q1,0": ["q0", "0", "R"],
            "q1,1": ["q1", "1", "R"],
            "q1,B": ["qReject", "B", "R"]

        }

    },

    // MACHINE 2: BINARY INCREMENTER
    increment: {

        name: "Binary Incrementer",

        initial: "qScan",

        accept: ["qAccept"],

        reject: ["qReject"],

        alphabet: ["0", "1"],

        transitions: {

            "qScan,0": ["qScan", "0", "R"],
            "qScan,1": ["qScan", "1", "R"],

            "qScan,B": ["qCarry", "B", "L"],

            "qCarry,0": ["qAccept", "1", "R"],

            "qCarry,1": ["qCarry", "0", "L"],

            "qCarry,B": ["qAccept", "1", "R"]

        }

    },

    // MACHINE 3: UNARY ADDITION
    addition: {

        name: "Unary Addition",

        initial: "qFind",

        accept: ["qAccept"],

        reject: ["qReject"],

        alphabet: ["1", "+"],

        transitions: {

            "qFind,1": ["qFind", "1", "R"],

            "qFind,+": ["qEnd", "1", "R"],

            "qEnd,1": ["qEnd", "1", "R"],

            "qEnd,B": ["qErase", "B", "L"],

            "qErase,1": ["qAccept", "B", "R"]

        }

    },
    palindrome: {

    name: "Binary Palindrome Checker",

    initial: "qStart",

    accept: ["qAccept"],

    reject: ["qReject"],

    alphabet: ["0", "1", "X", "Y"],

    transitions: {

        // Find the leftmost unmarked symbol
        "qStart,X": ["qStart", "X", "R"],
        "qStart,Y": ["qStart", "Y", "R"],

        "qStart,0": ["qFind0", "X", "R"],
        "qStart,1": ["qFind1", "Y", "R"],

        "qStart,B": ["qAccept", "B", "R"],

        // Move right to the end when matching 0
        "qFind0,0": ["qFind0", "0", "R"],
        "qFind0,1": ["qFind0", "1", "R"],
        "qFind0,X": ["qFind0", "X", "R"],
        "qFind0,Y": ["qFind0", "Y", "R"],
        "qFind0,B": ["qCheck0", "B", "L"],

        // Move right to the end when matching 1
        "qFind1,0": ["qFind1", "0", "R"],
        "qFind1,1": ["qFind1", "1", "R"],
        "qFind1,X": ["qFind1", "X", "R"],
        "qFind1,Y": ["qFind1", "Y", "R"],
        "qFind1,B": ["qCheck1", "B", "L"],

        // Check the rightmost unmarked symbol
        "qCheck0,X": ["qCheck0", "X", "L"],
        "qCheck0,Y": ["qCheck0", "Y", "L"],
        "qCheck0,0": ["qReturn", "X", "L"],
        "qCheck0,1": ["qReject", "1", "R"],
        "qCheck0,B": ["qAccept", "B", "R"],

        "qCheck1,X": ["qCheck1", "X", "L"],
        "qCheck1,Y": ["qCheck1", "Y", "L"],
        "qCheck1,1": ["qReturn", "Y", "L"],
        "qCheck1,0": ["qReject", "0", "R"],
        "qCheck1,B": ["qAccept", "B", "R"],

        // Return to the left side
        "qReturn,0": ["qReturn", "0", "L"],
        "qReturn,1": ["qReturn", "1", "L"],
        "qReturn,X": ["qReturn", "X", "L"],
        "qReturn,Y": ["qReturn", "Y", "L"],
        "qReturn,B": ["qStart", "B", "R"]

    }

}

};

const machineInput =
    document.getElementById("inputString");

const machineSelect =
    document.getElementById("machine");

function validateInput(input, type) {
    if (type === "even" || type === "increment") {
        return /^[01]*$/.test(input) &&
            (type !== "increment" || input.length > 0);
    }

    if (type === "addition") {
        return /^1+\+1+$/.test(input);
    }
    if (type === "palindrome") {
    return /^[01]*$/.test(input);
    }


    return false;
}

function startMachine() {

    const input = machineInput.value.trim();

    selectedMachine = machines[machineSelect.value];

    if (!selectedMachine) return;

    if (!validateInput(input, machineSelect.value)) {

        alert("Invalid input!");

        return;

    }

    tape = ["B", ...input.split(""), "B", "B"];

    head = 1;

    currentState = selectedMachine.initial;

    stepCount = 0;

    history = [];

    stopped = false;

    document.getElementById("history").innerHTML = "";

    document.getElementById("transitionInfo").innerHTML =
        "Machine initialized.";
    document.getElementById("stepExplanation").textContent =
    "The machine has started. Click Next Step to see what happens.";

    document.getElementById("result").textContent = "Running";

    display();

}

function nextStep() {

    if (stopped || !selectedMachine) return;

    if (selectedMachine.accept.includes(currentState) ||
        selectedMachine.reject.includes(currentState)) {

        stopped = true;

        display();

        return;

    }

    const read = tape[head] ?? BLANK;

    const key = currentState + "," + read;

    const rule = selectedMachine.transitions[key];

    if (!rule) {

        currentState = "qReject";

        stopped = true;

        document.getElementById("transitionInfo").textContent =
            "No transition found. Machine rejected the input.";

        display();

        return;

    }

    const oldState = currentState;

    const [nextState, write, direction] = rule;

    tape[head] = write;

    if (direction === "R") {

        head++;

    } else {

        head--;

    }

    if (head < 0) {

        tape.unshift(BLANK);

        head = 0;

    }

    if (head >= tape.length) {

        tape.push(BLANK);

    }

    currentState = nextState;

    stepCount++;

    history.push({

        step: stepCount,

        state: oldState,

        read: read,

        write: write,

        move: direction,

        next: nextState

    });
    explainStep(
    oldState,
    read,
    write,
    direction,
    nextState,
    machineSelect.value
);

    if (selectedMachine.accept.includes(currentState) ||
        selectedMachine.reject.includes(currentState)) {

        stopped = true;

    }

    display();

}

function runMachine() {

    if (stopped || !selectedMachine) return;

    let safety = 1000;

    while (!stopped && safety > 0) {

        nextStep();

        safety--;

    }

    if (safety === 0) {

        stopped = true;

        currentState = "qReject";

        document.getElementById("transitionInfo").textContent =
            "Execution stopped: step limit reached.";

        display();

    }

}

function resetMachine() {

    tape = [];

    head = 0;

    currentState = "";

    stepCount = 0;

    history = [];

    stopped = true;

    selectedMachine = null;

    document.getElementById("state").textContent = "-";

    document.getElementById("head").textContent = "-";

    document.getElementById("steps").textContent = "0";

    document.getElementById("result").textContent = "Waiting";

    document.getElementById("tape").innerHTML =
        "<p>Start the machine to view the tape</p>";

    document.getElementById("history").innerHTML = "";

    document.getElementById("transitionInfo").textContent =
        "No transition performed yet.";

    document.getElementById("headLabel").textContent = "";
    document.getElementById("stepExplanation").textContent =
    "Start the machine to see the step-by-step explanation.";

}

function display() {

    document.getElementById("state").textContent =
        currentState;

    document.getElementById("head").textContent =
        head;

    document.getElementById("steps").textContent =
        stepCount;

    const result = document.getElementById("result");

    if (selectedMachine.accept.includes(currentState)) {

        result.textContent = "ACCEPTED";

        result.style.color = "green";

    }

    else if (selectedMachine.reject.includes(currentState)) {

        result.textContent = "REJECTED";

        result.style.color = "red";

    }

    else {

        result.textContent = "RUNNING";

        result.style.color = "#2563eb";

    }

    const tapeElement = document.getElementById("tape");

    tapeElement.innerHTML = "";

    tape.forEach((symbol, index) => {

        const cell = document.createElement("div");

        cell.className = "cell";

        if (index === head) {

            cell.classList.add("active");

        }

        cell.textContent = symbol === BLANK ? "□" : symbol;

        tapeElement.appendChild(cell);

    });

    document.getElementById("headLabel").textContent =
        "▲ Head position: " + head;

    const historyBody = document.getElementById("history");

    historyBody.innerHTML = "";

    history.forEach(item => {

        const row = document.createElement("tr");

        [

            item.step,

            item.state,

            item.read === BLANK ? "□" : item.read,

            item.write === BLANK ? "□" : item.write,

            item.move,

            item.next

        ].forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        historyBody.appendChild(row);

    });

    if (history.length > 0) {

        const last = history[history.length - 1];

        document.getElementById("transitionInfo").textContent =

            "δ(" + last.state + ", " +

            (last.read === BLANK ? "□" : last.read) +

            ") = (" + last.next + ", " +

            (last.write === BLANK ? "□" : last.write) +

            ", " + last.move + ")";

    }

}
function renderTransitionTable() {

    const machine = machines[machineSelect.value];

    const tableBody = document.getElementById("transitionTable");

    tableBody.innerHTML = "";

    for (const [key, rule] of Object.entries(machine.transitions)) {

        const [state, read] = key.split(",");

        const [nextState, write, direction] = rule;

        const row = document.createElement("tr");

        const values = [
            state,
            read === BLANK ? "□" : read,
            nextState,
            write === BLANK ? "□" : write,
            direction
        ];

        values.forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        tableBody.appendChild(row);

    }

}
machineSelect.addEventListener("change", function() {
    renderTransitionTable();
    showMachineExplanation();
});

renderTransitionTable();
showMachineExplanation();
function showMachineExplanation() {

    const type = machineSelect.value;

    const explanations = {

        even: `
            <h3>Binary Even-Zero Checker</h3>
            <p><strong>Purpose:</strong> Checks whether a binary string contains an even number of zeros.</p>
            <p><strong>Input format:</strong> Binary strings containing 0 and 1.</p>
            <p><strong>Working:</strong> The machine changes between two states whenever it reads a zero. Reading a one keeps the state unchanged.</p>
            <p><strong>Example:</strong> 1010 → Accepted (two zeros).</p>
        `,

        increment: `
            <h3>Binary Incrementer</h3>
            <p><strong>Purpose:</strong> Adds 1 to a binary number.</p>
            <p><strong>Input format:</strong> A non-empty binary string.</p>
            <p><strong>Working:</strong> The machine moves to the right end and then performs binary addition using carry.</p>
            <p><strong>Example:</strong> 111 → 1000.</p>
        `,

        addition: `
            <h3>Unary Addition</h3>
            <p><strong>Purpose:</strong> Adds two unary numbers.</p>
            <p><strong>Input format:</strong> Two groups of 1s separated by +.</p>
            <p><strong>Working:</strong> The machine replaces the plus sign with 1 and removes one extra 1 at the end.</p>
            <p><strong>Example:</strong> 111+11 → 11111.</p>
        `,
        palindrome: `
    <h3>Binary Palindrome Checker</h3>
    <p><strong>Purpose:</strong> Checks whether a binary string reads the same forward and backward.</p>
    <p><strong>Input format:</strong> Binary strings containing 0 and 1.</p>
    <p><strong>Working:</strong> The machine marks the leftmost symbol, moves to the right end, and compares it with the rightmost unmarked symbol. It repeats this process.</p>
    <p><strong>Example:</strong> 101 → Accepted.</p>
`,

    };

    document.getElementById("machineExplanation").innerHTML =
        explanations[type];

}
function explainStep(state, read, write, direction, nextState, machineType) {

    const symbol = read === BLANK ? "blank symbol (□)" : read;
    const written = write === BLANK ? "blank symbol (□)" : write;

    let explanation = "";

    if (machineType === "even") {

        if (read === "0") {
            explanation = "The machine read 0, so it changes between the two states used to track the number of zeros.";
        } else if (read === "1") {
            explanation = "The machine read 1. The number of zeros does not change, so the zero-count state remains the same.";
        } else {
            explanation = "The machine reached the end of the input. It checks whether the number of zeros is even.";
        }

    } else if (machineType === "increment") {

        if (state === "qScan") {
            explanation = "The machine is scanning the binary number to find its right end.";
        } else if (read === "1") {
            explanation = "The machine is carrying 1. It changes this 1 to 0 and moves left to continue the carry.";
        } else if (read === "0") {
            explanation = "The carry is completed by changing 0 to 1.";
        } else {
            explanation = "The carry reached the blank cell, so a new 1 is written at the left.";
        }

    } else if (machineType === "addition") {

        if (read === "+") {
            explanation = "The machine replaces the plus sign with 1, joining the two unary groups.";
        } else if (state === "qFind") {
            explanation = "The machine moves right to find the plus sign.";
        } else if (state === "qEnd") {
            explanation = "The machine moves right to the end of the unary number.";
        } else if (state === "qErase") {
            explanation = "The machine removes the extra 1 at the end to complete unary addition.";
        }

    }else if (machineType === "palindrome") {

    if (state === "qStart") {
        explanation = "The machine searches for the leftmost unmarked symbol.";
    } else if (state === "qFind0" || state === "qFind1") {
        explanation = "The machine moves right to find the last unmarked symbol.";
    } else if (state === "qCheck0" || state === "qCheck1") {
        explanation = "The machine compares the rightmost unmarked symbol with the symbol selected on the left.";
    } else if (state === "qReturn") {
        explanation = "The machine returns to the left side to compare the next pair.";
    }
}


    document.getElementById("stepExplanation").textContent =
        explanation +
        " Transition: δ(" + state + ", " + symbol + ") = (" +
        nextState + ", " + written + ", " + direction + ").";
}
function selectMachine(machineType) {

    machineSelect.value = machineType;

    renderTransitionTable();

    showMachineExplanation();

    resetMachine();

    document.getElementById("inputString").focus();

}