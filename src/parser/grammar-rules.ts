import { CharacterTokenType, LiteralTokenType } from "../tokenizer/renpy-tokens";
import { ASTNode, ExpressionNode, LiteralNode } from "./ast-nodes";
import { DocumentParser } from "./parser";

export enum Associativity {
    Left,
    Right,
}

export abstract class Rule {
    public abstract test(state: DocumentParser): boolean;
    public abstract parse(state: DocumentParser): ASTNode | null;
}

/**
 * Expression
 *   : Literal
 *   | ParenthesizedExpression
 *   ;
 */
export class ExpressionRule extends Rule {
    rules: Rule[] = [new ParenthesizedExpressionRule(), new LiteralRule()];

    public test(state: DocumentParser): boolean {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return true;
            }
        }

        return false;
    }

    public parse(state: DocumentParser): ExpressionNode | null {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return rule.parse(state) as ExpressionNode;
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
export class ParenthesizedExpressionRule extends Rule {
    public test(state: DocumentParser): boolean {
        return state.test(CharacterTokenType.OpenParentheses);
    }

    public parse(state: DocumentParser): ExpressionNode | null {
        state.next();

        const expression = state.parseExpression();
        if (expression === null) {
            return null;
        }

        state.next();
        if (state.require(CharacterTokenType.CloseParentheses)) {
            return null;
        }

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

/**
 * Literal
 *   : IntegerLiteral
 *   | FloatLiteral
 *   ;
 */
export class LiteralRule extends Rule {
    rules: Rule[] = [new IntegerLiteralRule(), new FloatLiteralRule()];

    public test(state: DocumentParser): boolean {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return true;
            }
        }

        return false;
    }

    public parse(state: DocumentParser): LiteralNode | null {
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
export class IntegerLiteralRule extends Rule {
    public test(state: DocumentParser): boolean {
        return state.test(LiteralTokenType.Integer);
    }

    public parse(state: DocumentParser): LiteralNode | null {
        state.require(LiteralTokenType.Integer);
        return new LiteralNode(state.currentTokenValue());
    }
}

/**
 * FloatLiteral
 *  : LiteralTokenType.Float
 * ;
 * */
export class FloatLiteralRule extends Rule {
    public test(state: DocumentParser): boolean {
        return state.test(LiteralTokenType.Float);
    }

    public parse(state: DocumentParser): LiteralNode | null {
        state.require(LiteralTokenType.Float);
        return new LiteralNode(state.currentTokenValue());
    }
}

/*export class VariableRule extends Rule {
    public parse(state: ParserState): VariableNode | null {
        const token = state.popToken();
        if (token.type != TokenType.Identifier) {
            return null;
        }

        return new VariableNode(token.value);
    }
}*/

/*export class StatementRule extends Rule {
    public parse(state: ParserState): StatementNode | null {
        const rules: Rule[] = [new IfStatementRule(), new WhileStatementRule(), new AssignmentStatementRule(), new ExpressionStatementRule()];

        for (const rule of rules) {
            const node = rule.match(state);
            if (node !== null) {
                return node;
            }
        }

        return null;
    }
}

export class IfStatementRule extends Rule {
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
