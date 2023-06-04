import { TokenType } from "src/tokenizer/renpy-tokens";

export abstract class ASTNode {}

export class StatementNode extends ASTNode {}
export class ExpressionNode extends ASTNode {}

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

export class FunctionCallNode extends StatementNode {
    public name: string;
    public args: ExpressionNode[];

    constructor(name: string, args: ExpressionNode[]) {
        super();
        this.name = name;
        this.args = args;
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

export class LiteralNode extends ExpressionNode {
    public value: any;

    constructor(value: any) {
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
