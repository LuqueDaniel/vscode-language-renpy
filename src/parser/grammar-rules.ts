import { CharacterTokenType, EntityTokenType, LiteralTokenType, MetaTokenType, TokenType } from "../tokenizer/renpy-tokens";
import { ASTNode, AssignmentOperationNode, ExpressionNode, LiteralNode, IdentifierNode } from "./ast-nodes";
import { DocumentParser } from "./parser";

export abstract class GrammarRule<T extends ASTNode> {
    public abstract test(parser: DocumentParser): boolean;
    public abstract parse(parser: DocumentParser): T | null;
}

/**
 * Expression
 *   : Literal
 *   | ParenthesizedExpression
 *   ;
 */
export class ExpressionRule extends GrammarRule<ExpressionNode> {
    rules = [new LiteralRule(), new ParenthesizedExpressionRule()];

    public test(parser: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(parser)) {
                return true;
            }
        }

        return false;
    }

    public parse(parser: DocumentParser): ExpressionNode | LiteralNode | null {
        for (const rule of this.rules) {
            if (rule.test(parser)) {
                return rule.parse(parser);
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

    public test(parser: DocumentParser) {
        return parser.test(CharacterTokenType.OpenParentheses);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(CharacterTokenType.OpenParentheses);
        const expression = this.expressionParser.parse(parser);
        parser.requireToken(CharacterTokenType.CloseParentheses);
        return expression;
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
    public test(parser: DocumentParser) {
        return parser.test(MetaTokenType.PythonExpression);
    }

    public parse(parser: DocumentParser) {
        let expression = "";
        while (parser.test(MetaTokenType.PythonExpression)) {
            parser.next();
            expression += parser.currentValue();
        }
        return new LiteralNode(expression);
    }
}

/**
 * simple_expression = OPERATOR*, (PYTHON_STRING | NAME | FLOAT | parenthesized_python), [(".", NAME) | parenthesized_python]
 */
export class SimpleExpressionRule extends GrammarRule<ExpressionNode> {
    public test(parser: DocumentParser) {
        return parser.test(MetaTokenType.SimpleExpression);
    }

    public parse(parser: DocumentParser) {
        let expression = "";
        while (parser.test(MetaTokenType.SimpleExpression)) {
            parser.next();
            expression += parser.currentValue();
        }
        return new LiteralNode(expression);
    }
}

/**
 * Literal
 *   : IntegerLiteral
 *   | FloatLiteral
 *   | StringLiteral
 *   ;
 */
export class LiteralRule extends GrammarRule<ExpressionNode> {
    rules = [new IntegerLiteralRule(), new FloatLiteralRule(), new StringLiteralRule()];

    public test(parser: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(parser)) {
                return true;
            }
        }

        return false;
    }

    public parse(parser: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(parser)) {
                return rule.parse(parser) as LiteralNode;
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
    public test(parser: DocumentParser) {
        return parser.test(LiteralTokenType.Integer);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(LiteralTokenType.Integer);
        return new LiteralNode(parser.currentValue());
    }
}

/**
 * StringLiteral
 *   : LiteralTokenType.String
 *   ;
 */
export class StringLiteralRule extends GrammarRule<LiteralNode> {
    public test(parser: DocumentParser) {
        return parser.test(LiteralTokenType.String);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(LiteralTokenType.String);
        return new LiteralNode(parser.currentValue());
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

export class IdentifierRule extends GrammarRule<IdentifierNode> {
    public test(parser: DocumentParser) {
        return parser.test(EntityTokenType.VariableName);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(EntityTokenType.VariableName);
        return new IdentifierNode(parser.locationFromCurrent(), parser.currentValue());
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
