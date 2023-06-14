import { tokenTypeToString } from "../tokenizer/token-definitions";
import { TokenType } from "../tokenizer/renpy-tokens";
import { Vector } from "../utilities/vector";
import { Range as VSRange } from "vscode";

export abstract class ASTNode {
    private static _printIndent = 0;
    public location: VSRange;

    constructor(location: VSRange) {
        this.location = location;
    }

    public toString(): string {
        const object = { type: this.constructor.name, ...this };
        let output = "{\n";
        ASTNode._printIndent += 2;
        Object.entries(object).forEach(([key, v]) => {
            output += " ".repeat(ASTNode._printIndent);
            const tokenString = tokenTypeToString(v);
            const value = tokenString || v;
            output += `${key}: ${value}\n`;
        });
        ASTNode._printIndent -= 2;
        output += " ".repeat(ASTNode._printIndent);
        output += "}";
        return output;
    }

    public abstract process(): void;
}
export abstract class StatementNode extends ASTNode {}
export abstract class ExpressionNode extends ASTNode {}

export class AST {
    public nodes: Vector<ASTNode> = new Vector<ASTNode>();

    public append(node: ASTNode | null) {
        if (node !== null) {
            this.nodes.pushBack(node);
        }
    }

    public toString(): string {
        return this.nodes.toString();
    }
}

export class IfStatementNode extends StatementNode {
    public condition: ExpressionNode;
    public thenBranch: StatementNode;
    public elseBranch: StatementNode | null;

    constructor(condition: ExpressionNode, thenBranch: StatementNode, elseBranch: StatementNode | null) {
        super();
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }
}

export class WhileStatementNode extends StatementNode {
    public condition: ExpressionNode;
    public body: StatementNode;

    constructor(condition: ExpressionNode, body: StatementNode) {
        super();
        this.condition = condition;
        this.body = body;
    }
}

export class AssignmentStatementNode extends StatementNode {
    public name: string;
    public value: ExpressionNode;

    constructor(name: string, value: ExpressionNode) {
        super();
        this.name = name;
        this.value = value;
    }
}

export class ExpressionStatementNode extends StatementNode {
    public expression: ExpressionNode;

    constructor(expression: ExpressionNode) {
        super();
        this.expression = expression;
    }
}

export class FunctionDefinitionNode extends StatementNode {
    public name: string;
    public args: ExpressionNode[];

    constructor(name: string, args: ExpressionNode[]) {
        super();
        this.name = name;
        this.args = args;
    }
}

export class FunctionCallNode extends StatementNode {
    public name: string;
    public args: ExpressionNode[];

    constructor(name: string, args: ExpressionNode[]) {
        super();
        this.name = name;
        this.args = args;
    }
}

export class ClassDefinitionNode extends StatementNode {
    public name: string;
    public body: StatementNode[];

    constructor(name: string, body: StatementNode[]) {
        super();
        this.name = name;
        this.body = body;
    }
}

export class BinaryOperationNode extends ExpressionNode {
    public left: ExpressionNode;
    public operator: TokenType;
    public right: ExpressionNode;

    constructor(left: ExpressionNode, operator: TokenType, right: ExpressionNode) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

export class UnaryOperationNode extends ExpressionNode {
    public operator: TokenType;
    public operand: ExpressionNode;

    constructor(operator: TokenType, operand: ExpressionNode) {
        super();
        this.operator = operator;
        this.operand = operand;
    }
}

type LiteralValue = string | number | boolean;
export class LiteralNode extends ExpressionNode {
    public value: LiteralValue;

    constructor(value: LiteralValue) {
        super();
        this.value = value;
    }
}

export class VariableNode extends ExpressionNode {
    public name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }
}

export class AssignmentOperationNode extends ExpressionNode {
    public left: ExpressionNode;
    public operation: TokenType;
    public right: ExpressionNode;

    constructor(variable: ExpressionNode, operation: TokenType, value: ExpressionNode) {
        super();
        this.left = variable;
        this.operation = operation;
        this.right = value;
    }
}

export class DefineStatementNode extends StatementNode {
    public assignmentOperation: AssignmentOperationNode | null;
    public offset: LiteralNode;

    constructor(offset: LiteralNode, assignmentOperation: AssignmentOperationNode | null) {
        super();
        this.offset = offset;
        this.assignmentOperation = assignmentOperation;
    }
}

export class DefaultStatementNode extends StatementNode {
    public assignmentOperation: AssignmentOperationNode | null;
    public offset: LiteralNode;

    constructor(offset: LiteralNode, assignmentOperation: AssignmentOperationNode | null) {
        super();
        this.offset = offset;
        this.assignmentOperation = assignmentOperation;
    }
}
