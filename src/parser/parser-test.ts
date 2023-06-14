import { DocumentParser } from "./parser";
import { window } from "vscode";
import { RenpyStatementRule } from "./renpy-grammar-rules";
import { AST, FunctionCallNode, FunctionDefinitionNode, VariableNode } from "./ast-nodes";
import { LogCategory, LogLevel, logCatMessage } from "../logger";
import { Vector } from "../utilities/vector";

export async function testParser() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== "renpy") {
        return;
    }

    const state = new DocumentParser(activeEditor.document);
    await state.initialize();

    const statementParser = new RenpyStatementRule();
    const ast = new AST();

    while (state.hasNext()) {
        state.skipEmptyLines();

        if (statementParser.test(state)) {
            ast.append(statementParser.parse(state));
            state.expectEOL();
        }

        if (state.hasNext()) {
            state.next();
        }
    }

    state.printErrors();
    logCatMessage(LogLevel.Info, LogCategory.Parser, ast.toString(), true);
}

class Variable {
    public definition: VariableNode;
    public references: Vector<VariableNode> = new Vector<VariableNode>();

    constructor(definition: VariableNode) {
        this.definition = definition;
    }

    public addReference(reference: VariableNode) {
        this.references.pushBack(reference);
    }
}

class Function {
    public definition: FunctionDefinitionNode;
    public references: Vector<FunctionCallNode> = new Vector<FunctionCallNode>();

    constructor(definition: FunctionDefinitionNode) {
        this.definition = definition;
    }

    public addReference(reference: FunctionCallNode) {
        this.references.pushBack(reference);
    }
}

class Scope {
    public parent: Scope | null = null;
    public variables: Map<string, Variable> = new Map<string, Variable>();
    public functions: Map<string, Function> = new Map<string, Function>();

    public addVariable(variable: Variable) {
        // throw if variable already exists
        if (this.variables.has(variable.definition.name)) {
            throw new Error("Variable already exists");
        }

        this.variables.set(variable.definition.name, variable);
    }

    public addFunction(func: Function) {
        // throw if function already exists
        if (this.functions.has(func.definition.name)) {
            throw new Error("Function already exists");
        }

        this.functions.set(func.definition.name, func);
    }
}

class Class {
    public definition: ClassDefinitionNode;
    public scope: Scope = new Scope();
    public constructorFunction: Function | null = null;
    public references: Vector<ClassInstantiationNode> = new Vector<ClassInstantiationNode>();

    constructor(definition: ClassDefinitionNode) {
        this.definition = definition;
    }

    public setConstructor(func: Function) {
        this.constructorFunction = func;
    }

    public addReference(reference: ClassInstantiationNode) {
        this.references.pushBack(reference);
    }
}

class ProgramDatabase {
    public scopes: Vector<Scope> = new Vector<Scope>();

    public addScope(scope: Scope) {
        this.scopes.pushBack(scope);
    }
}

function processAST(ast: AST) {
    const nodes = ast.nodes;
    for (let i = 0; i < nodes.size; i++) {
        const node = nodes.at(i);
        node.
        if (node.type === "label") {
            processLabel(node);
        }
    }
}


/*function processClassDefinition(node: ClassDefinitionNode, currentScope: Scope) {
    // create a new Class object
    let cls = new Class(node);

    // create a new Scope object for the class
    let classScope = new Scope();
    classScope.parent = currentScope;
    cls.scope = classScope;

    // add the class to the current scope
    currentScope.addClass(cls);

    // process the body of the class
    for (let childNode of node.body) {
        processNode(childNode, classScope);
    }
}

function processNode(node: ASTNode, currentScope: Scope) {
    if (node instanceof ClassDefinitionNode) {
        processClassDefinition(node, currentScope);
    } else if (node instanceof FunctionDefinitionNode) {
        // ...
    } else if (node instanceof VariableNode) {
        // ...
    } else {
        // ...
    }
}*/