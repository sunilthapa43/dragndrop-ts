"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class ProjectState extends State {
    constructor() {
        super();
        this.projects = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        else {
            this.instance = new ProjectState();
            return this.instance;
        }
    }
    addProject(title, desc, noOfPeople) {
        const newProject = new Project(Math.random().toString(), title, desc, noOfPeople, ProjectStatus.Active);
        this.projects.push(newProject);
        this.updateListeners();
        for (const listenersFn of this.listeners) {
            listenersFn(this.projects.slice());
        }
        console.log(this.projects);
    }
    moveProject(prjId, newStatus) {
        const project = this.projects.find(prj => prj.id === prjId);
        if (project && project.prjStatus !== newStatus) {
            project.prjStatus = newStatus;
            this.updateListeners();
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
const projectState = ProjectState.getInstance();
function validate(validatable) {
    let isValid = true;
    if (validatable.required) {
        isValid = isValid && validatable.value.toString().trim().length !== 0;
    }
    if (validatable.minLen !== undefined &&
        typeof validatable.value === "string") {
        isValid = isValid && validatable.value.length > validatable.minLen;
    }
    if (validatable.maxLen !== undefined &&
        typeof validatable.value === "string") {
        isValid = isValid && validatable.value.length < validatable.maxLen;
    }
    if (validatable.min !== null &&
        validatable.min !== undefined &&
        typeof validatable.value === "number") {
        isValid = isValid && validatable.value > validatable.min;
    }
    if (validatable.max !== null &&
        validatable.max !== undefined &&
        typeof validatable.value === "number") {
        isValid = isValid && validatable.value < validatable.max;
    }
    return isValid;
}
//autobind decorator
function autobind(_, _1, descriptor) {
    //_ if we know that we are not going to use that value anyway
    const originalMethod = descriptor.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            const boudnFn = originalMethod.bind(this);
            return boudnFn;
        },
    };
    return adjDescriptor;
}
//Component base class:
class Component {
    constructor(templateId, hostElemId, insertAtStart, newElemId) {
        this.templateElem = (document.getElementById(templateId));
        this.hostElem = document.getElementById(hostElemId);
        const importedNode = document.importNode(this.templateElem.content, true);
        this.elem = importedNode.firstElementChild;
        if (newElemId) {
            this.elem.id = newElemId;
        }
        this.attach(insertAtStart);
    }
    attach(insertAtBeginning) {
        this.hostElem.insertAdjacentElement(insertAtBeginning ? "afterbegin" : "beforeend", this.elem);
    }
}
//
class ProjectInput extends Component {
    constructor() {
        super("project-input", "app", true, "user-input");
        this.titleInput = this.elem.querySelector("#title");
        this.descElem = this.elem.querySelector("#description");
        this.peopleElem = this.elem.querySelector("#people");
        this.configure();
    }
    gatherUserinput() {
        const enteredTitle = this.titleInput.value;
        const enteredDesc = this.descElem.value;
        const enteredPeople = this.peopleElem.value;
        const titleValidatable = {
            value: enteredTitle,
            required: true,
        };
        const descValidatable = {
            value: enteredDesc,
            required: true,
            minLen: 5,
        };
        const peopleValidatable = {
            value: enteredPeople,
            required: true,
            min: 1,
            max: 5,
        };
        if (!validate(titleValidatable) ||
            !validate(descValidatable) ||
            !validate(peopleValidatable)) {
            alert("Invalid Input");
            return;
        }
        else {
            return [enteredTitle, enteredDesc, +enteredPeople];
        }
    }
    clearAll() {
        this.titleInput.value = "";
        this.descElem.value = "";
        this.peopleElem.value = "";
    }
    submitHandler(e) {
        e.preventDefault();
        const userInput = this.gatherUserinput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            this.clearAll();
        }
    }
    renderContent() { }
    configure() {
        this.elem.addEventListener("submit", this.submitHandler);
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "submitHandler", null);
//ProjectType class
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
class Project {
    constructor(id, title, desc, people, prjStatus) {
        this.id = id;
        this.title = title;
        this.desc = desc;
        this.people = people;
        this.prjStatus = prjStatus;
    }
}
//ProjectItem class
class ProjectItem extends Component {
    constructor(hostId, project) {
        super("single-project", hostId, false, project.id);
        this.project = project;
        this.renderContent();
        this.configure();
    }
    get persons() {
        if (this.project.people === 1) {
            return "1 person";
        }
        else {
            return `${this.project.people} persons`;
        }
    }
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.project.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    dragEndHandler(_) { }
    configure() {
        this.elem.addEventListener("dragstart", this.dragStartHandler);
        this.elem.addEventListener("dragend", this.dragEndHandler);
    }
    renderContent() {
        this.elem.querySelector("h2").textContent =
            "Project Name: " + this.project.title;
        this.elem.querySelector("p").textContent = this.project.desc;
        this.elem.querySelector("h3").textContent = this.persons + " assigned";
    }
}
__decorate([
    autobind
], ProjectItem.prototype, "dragStartHandler", null);
//
//Project list class
class ProjectList extends Component {
    constructor(type) {
        super("project-list", "app", false, `${type}-projects-list`);
        this.type = type;
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
        this.renderProjects();
    }
    dragOverHandler(e) {
        if (e.dataTransfer && e.dataTransfer.types[0] === 'text/plain') {
            e.preventDefault();
            const listEl = this.elem.querySelector("ul");
            listEl.classList.add("droppable");
        }
    }
    dropHandler(e) {
        const prjId = (e.dataTransfer.getData('text/plain'));
        projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    }
    dragLeaveHandler(e) {
        const listEl = this.elem.querySelector("ul");
        listEl.classList.remove("droppable");
    }
    configure() {
        this.elem.addEventListener("dragover", this.dragOverHandler);
        this.elem.addEventListener("dragleave", this.dragLeaveHandler);
        this.elem.addEventListener("drop", this.dropHandler);
        projectState.addListener((projects) => {
            const relevantPrjs = projects.filter((prj) => {
                if (this.type === "active") {
                    return prj.prjStatus === ProjectStatus.Active;
                }
                return prj.prjStatus === ProjectStatus.Finished;
            });
            this.assignedProjects = relevantPrjs;
            this.renderProjects();
        });
    }
    renderProjects() {
        const list = (document.getElementById(`${this.type}-project-list`));
        list.innerHTML = "";
        for (const prjItem of this.assignedProjects) {
            new ProjectItem(this.elem.querySelector("ul").id, prjItem);
        }
    }
    renderContent() {
        const listId = `${this.type}-project-list`;
        this.elem.querySelector("ul").id = listId;
        this.elem.querySelector("h2").textContent =
            this.type.toUpperCase() + " PROJECTS";
    }
}
__decorate([
    autobind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dropHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dragLeaveHandler", null);
const prInp = new ProjectInput();
// const activePrjList = new ProjectList("active");
// const finishedPrjList = new ProjectList("finished");
const activeList = new ProjectList("active");
const finishedList = new ProjectList("finished");
