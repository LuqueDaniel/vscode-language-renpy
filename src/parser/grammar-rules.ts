import exp from "constants";
import { CharacterTokenType, EntityTokenType, LiteralTokenType, MetaTokenType, TokenType } from "../tokenizer/renpy-tokens";
import { ASTNode, AssignmentOperationNode, ExpressionNode, LiteralNode, VariableNode as VariableNameNode } from "./ast-nodes";
import { DocumentParser } from "./parser";

export abstract class GrammarRule<T extends ASTNode> {
    public abstract test(state: DocumentParser): boolean;
    public abstract parse(state: DocumentParser): T | null;
}

/**
 * Expression
 *   : Literal
 *   | ParenthesizedExpression
 *   ;
 */
export class ExpressionRule extends GrammarRule<ExpressionNode> {
    rules = [new ParenthesizedExpressionRule(), new LiteralRule()];

    public test(state: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return true;
            }
        }

        return false;
    }

    public parse(state: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return rule.parse(state);
            }
        }

        return null;
    }
}

/**
 * ParenthesizedExpression
 *   : '(' Expression ')'
 *   ;
 */
export class ParenthesizedExpressionRule extends GrammarRule<ExpressionNode> {
    private expressionParser = new ExpressionRule();

    public test(state: DocumentParser) {
        return state.test(CharacterTokenType.OpenParentheses);
    }

    public parse(state: DocumentParser) {
        state.next();
        return null;
    }
}

/*export class BinaryExpressionRule extends Rule {
    public test(state: ParserState): boolean {}

    public parse(state: ParserState): BinaryOperationNode | null {
        const left = state.parseExpression();
        if (left === null) {
            return null;
        }

        const operator = state.popToken();
        if (!operator || !this.isBinaryOperator(operator)) {
            return null;
        }

        const right = state.parseExpression();
        if (right === null) {
            return null;
        }

        return new BinaryOperationNode(left, operator.type, right);
    }

    private isBinaryOperator(token: Token): boolean {
        return token.type === OperatorTokenType.Plus || token.type === OperatorTokenType.Minus || token.type === OperatorTokenType.Multiply || token.type === OperatorTokenType.Divide;
    }
}*/

/*export class UnaryOperationRule extends Rule {
    public parse(state: ParserState): UnaryOperationNode | null {
        const operator = state.popToken();
        if (!operator || !this.isUnaryOperator(operator)) {
            return null;
        }

        const operand = state.parseExpression();
        if (operand === null) {
            return null;
        }

        return new UnaryOperationNode(operator.type, operand);
    }

    private isUnaryOperator(token: Token): boolean {
        return null;
    }
}*/

export class PythonExpressionRule extends GrammarRule<ExpressionNode> {
    public test(state: DocumentParser) {
        return state.test(MetaTokenType.PythonExpression);
    }

    public parse(state: DocumentParser) {
        let expression = "";
        while (state.test(MetaTokenType.PythonExpression)) {
            state.next();
            expression += state.currentValue();
        }
        return new LiteralNode(expression);
    }
}

/**
 * Literal
 *   : IntegerLiteral
 *   | FloatLiteral
 *   ;
 */
export class LiteralRule extends GrammarRule<ExpressionNode> {
    rules = [new IntegerLiteralRule(), new FloatLiteralRule()];

    public test(state: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return true;
            }
        }

        return false;
    }

    public parse(state: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return rule.parse(state) as LiteralNode;
            }
        }

        return null;
    }
}

/**
 * IntegerLiteral
 *   : LiteralTokenType.Integer
 *   ;
 */
export class IntegerLiteralRule extends GrammarRule<LiteralNode> {
    public test(state: DocumentParser) {
        return state.test(LiteralTokenType.Integer);
    }

    public parse(state: DocumentParser) {
        state.requireToken(LiteralTokenType.Integer);
        return new LiteralNode(state.currentValue());
    }
}

/**
 * FloatLiteral
 *  : LiteralTokenType.Float
 * ;
 * */
export class FloatLiteralRule extends GrammarRule<LiteralNode> {
    public test(parser: DocumentParser) {
        return parser.test(LiteralTokenType.Float);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(LiteralTokenType.Float);
        return new LiteralNode(parser.currentValue());
    }
}

export class VariableNameRule extends GrammarRule<VariableNameNode> {
    public test(parser: DocumentParser) {
        return parser.test(EntityTokenType.VariableName);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(EntityTokenType.VariableName);
        return new VariableNameNode(parser.currentValue());
    }
}

export class AssignmentOperationRule extends GrammarRule<AssignmentOperationNode> {
    private _leftParser: GrammarRule<ExpressionNode>;
    private _operators: TokenType[];
    private _rightParser: GrammarRule<ExpressionNode>;

    constructor(leftParser: GrammarRule<ExpressionNode>, operators: TokenType[], rightParser: GrammarRule<ExpressionNode>) {
        super();
        this._leftParser = leftParser;
        this._operators = operators;
        this._rightParser = rightParser;
    }

    public test(parser: DocumentParser) {
        return this._leftParser.test(parser);
    }

    public parse(parser: DocumentParser) {
        const left = parser.require(this._leftParser);
        if (left === null) {
            return null;
        }

        if (!parser.anyOfToken(this._operators)) {
            return null;
        }
        const operator = parser.current().type;

        const right = parser.require(this._rightParser);
        if (right === null) {
            return null;
        }

        return new AssignmentOperationNode(left, operator, right);
    }
}

/*export class IfStatementRule extends Rule {
    public parse(state: ParserState): IfStatementNode | null {
        return null;
    }
}

export class WhileStatementRule extends Rule {
    public parse(state: ParserState): WhileStatementNode | null {
        return null;
    }
}

export class AssignmentStatementRule extends Rule {
    public parse(state: ParserState): AssignmentStatementNode | null {
        return null;
    }
}

export class ExpressionStatementRule extends Rule {
    public parse(state: ParserState): ExpressionNode | null {
        return null;
    }
}

export class FunctionCallRule extends Rule {
    public parse(state: ParserState): FunctionCallNode | null {
        /*const identifier = state.popToken();
        if (!identifier || identifier.type !== EntityTokenType.Identifier) {
            return null;
        }

        const openParen = state.popToken();
        if (openParen.type !== CharacterTokenType.OpenParentheses) {
            return null;
        }

        const args: ExpressionNode[] = [];
        const expressionRule = new ExpressionRule();
        while (true) {
            const arg = expressionRule.match(state);
            if (arg == null) {
                break;
            }
            args.push(arg);

            const comma = state.popToken();
            if (comma.type != TokenType.Comma) {
                break;
            }
        }

        const closeParen = state.popToken();
        if (closeParen.type != TokenType.CloseParentheses) {
            return null;
        }

        return new FunctionCallNode(identifier.value, args);
        return null;
    }
}*/
