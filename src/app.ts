// Drag and drop interface
interface Draggabale {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(e: DragEvent): void;
  dropHandler(e: DragEvent): void;
  dragLeaveHandler(e: DragEvent): void;
}
//

//Project state mhmt

type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];

  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    } else {
      this.instance = new ProjectState();
      return this.instance;
    }
  }

  addProject(title: string, desc: string, noOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      desc,
      noOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListeners();
    for (const listenersFn of this.listeners) {
      listenersFn(this.projects.slice());
    }
    console.log(this.projects);
  }

  moveProject(prjId: string, newStatus: ProjectStatus){
    const project  = this.projects.find(prj => prj.id === prjId);
    if(project && project.prjStatus !== newStatus){
      project.prjStatus   = newStatus ;
      this.updateListeners();
    }
    
    
  }
  private updateListeners(){
    for(const listenerFn of this.listeners){
      listenerFn(this.projects.slice());
    }
  }
}
const projectState = ProjectState.getInstance();

//validation

interface Validatable {
  value: string | number;

  required?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
}

function validate(validatable: Validatable) {
  let isValid = true;
  if (validatable.required) {
    isValid = isValid && validatable.value.toString().trim().length !== 0;
  }
  if (
    validatable.minLen !== undefined &&
    typeof validatable.value === "string"
  ) {
    isValid = isValid && validatable.value.length > validatable.minLen;
  }

  if (
    validatable.maxLen !== undefined &&
    typeof validatable.value === "string"
  ) {
    isValid = isValid && validatable.value.length < validatable.maxLen;
  }
  if (
    validatable.min !== null &&
    validatable.min !== undefined &&
    typeof validatable.value === "number"
  ) {
    isValid = isValid && validatable.value > validatable.min;
  }
  if (
    validatable.max !== null &&
    validatable.max !== undefined &&
    typeof validatable.value === "number"
  ) {
    isValid = isValid && validatable.value < validatable.max;
  }

  return isValid;
}

//autobind decorator

function autobind(_: any, _1: string, descriptor: PropertyDescriptor) {
  //_ if we know that we are not going to use that value anyway
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boudnFn = originalMethod.bind(this);
      return boudnFn;
    },
  };
  return adjDescriptor;
}

//Component base class:

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElem: HTMLTemplateElement;
  hostElem: T;
  elem: U;

  constructor(
    templateId: string,
    hostElemId: string,
    insertAtStart: boolean,
    newElemId?: string
  ) {
    this.templateElem = <HTMLTemplateElement>(
      document.getElementById(templateId)!
    );
    this.hostElem = <T>document.getElementById(hostElemId)!;

    const importedNode = document.importNode(this.templateElem.content, true);

    this.elem = <U>importedNode.firstElementChild;
    if (newElemId) {
      this.elem.id = newElemId;
    }
    this.attach(insertAtStart);
  }

  attach(insertAtBeginning: boolean) {
    this.hostElem.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.elem
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

//

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInput: HTMLInputElement;
  descElem: HTMLInputElement;
  peopleElem: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleInput = this.elem.querySelector("#title")! as HTMLInputElement;
    this.descElem = <HTMLInputElement>this.elem.querySelector("#description")!;
    this.peopleElem = <HTMLInputElement>this.elem.querySelector("#people")!;
    this.configure();
  }
  private gatherUserinput(): [string, string, number] | void {
    const enteredTitle = this.titleInput.value;
    const enteredDesc = this.descElem.value;
    const enteredPeople = this.peopleElem.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };
    const descValidatable: Validatable = {
      value: enteredDesc,
      required: true,
      minLen: 5,
    };

    const peopleValidatable: Validatable = {
      value: enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid Input");
      return;
    } else {
      return [enteredTitle, enteredDesc, +enteredPeople];
    }
  }

  private clearAll() {
    this.titleInput.value = "";
    this.descElem.value = "";

    this.peopleElem.value = "";
  }

  @autobind
  private submitHandler(e: Event) {
    e.preventDefault();
    const userInput = this.gatherUserinput();

    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      this.clearAll();
    }
  }
  renderContent(): void {}
  configure() {
    this.elem.addEventListener("submit", this.submitHandler);
  }
}

//ProjectType class

enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public desc: string,
    public people: number,
    public prjStatus: ProjectStatus
  ) {}
}
//ProjectItem class

class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggabale
{
  private project: Project;
  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;
    this.renderContent();
    this.configure(); 
  }
  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer! .setData('text/plain',this.project.id);
    event.dataTransfer!.effectAllowed = 'move';

    
  }
  dragEndHandler(_: DragEvent): void {}
  configure(): void {
    this.elem.addEventListener("dragstart", this.dragStartHandler);
    this.elem.addEventListener("dragend", this.dragEndHandler);
  }

  renderContent(): void {
    this.elem.querySelector("h2")!.textContent =
      "Project Name: " + this.project.title;
    this.elem.querySelector("p")!.textContent = this.project.desc;

    this.elem.querySelector("h3")!.textContent = this.persons + " assigned";
  }
}

//

//Project list class
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[];

  constructor(public type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects-list`);
    this.assignedProjects = [];
    this.configure();
    this.renderContent();
    this.renderProjects();
  }

  @autobind
  dragOverHandler(e: DragEvent): void {
    if(e.dataTransfer && e.dataTransfer.types[0] === 'text/plain'){
      e.preventDefault();
      const listEl = this.elem.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
    
  }
  @autobind
  dropHandler(e: DragEvent): void {
    const prjId = (e.dataTransfer!.getData('text/plain'));
    projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    
    
  }

  @autobind
  dragLeaveHandler(e: DragEvent): void {
    
    const listEl = this.elem.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  configure(): void {
    this.elem.addEventListener("dragover", this.dragOverHandler);
    this.elem.addEventListener("dragleave", this.dragLeaveHandler);
    this.elem.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
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

  private renderProjects() {
    const list = <HTMLUListElement>(
      document.getElementById(`${this.type}-project-list`)!
    );
    list.innerHTML = "";
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.elem.querySelector("ul")!.id, prjItem);
    }
  }
  renderContent() {
    const listId = `${this.type}-project-list`;
    this.elem.querySelector("ul")!.id = listId;
    this.elem.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
}

const prInp = new ProjectInput();
// const activePrjList = new ProjectList("active");
// const finishedPrjList = new ProjectList("finished");
const activeList = new ProjectList("active");
const finishedList = new ProjectList("finished");
