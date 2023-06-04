import { ExpressionNode } from "./ast-nodes";
import { ExpressionRule } from "./grammar-rules";
import { Token } from "./parser-test";
import { TokenType } from "src/tokenizer/renpy-tokens";

export class ParserState {
    private _tokens: Token[];
    private _index: number;
    private _scope: any[];
    private _precedence: number;

    constructor(tokens: Token[]) {
        this._tokens = tokens;
        this._index = 0;
        this._scope = [];
        this._precedence = 0;
    }

    public peekToken(): Token {
        if (this._index >= this._tokens.length) {
            throw new Error("Unexpected end of input");
        }
        return this._tokens[this._index];
    }

    public popToken(): Token {
        if (this._index >= this._tokens.length) {
            throw new Error("Unexpected end of input");
        }
        return this._tokens[this._index++];
    }

    public popTokenChecked(tokenType: TokenType): Token {
        const token = this.peekToken();
        if (token.type !== tokenType) {
            throw new Error(`Expected token type ${tokenType}, but got ${token.type}`);
        }
        return this.popToken();
    }

    public enterScope(scope: any): void {
        this._scope.push(scope);
    }

    public exitScope(): any {
        return this._scope.pop();
    }

    public currentScope(): any {
        return this._scope[this._scope.length - 1];
    }

    public setPrecedence(precedence: number): void {
        this._precedence = precedence;
    }

    public getPrecedence(): number {
        return this._precedence;
    }

    public parseExpression(): ExpressionNode | null {
        const rule = new ExpressionRule();
        return rule.parse(this);
    }
}

/*class Parser2 {
    private _variables: VariableBank;

    constructor(variables: VariableBank) {
        this._variables = variables;
    }

    public parse(tokens: Token[], errors: ParseError[]): IExpression {
        let state = new ParserState(tokens);
        return this.parseExpression(state, errors);
    }

    private parseExpression(state: ParserState, errors: ParseError[], precedence: number = 0): IExpression {
        let rule = new ExpressionRule(precedence);
        return rule.match(state);
    }
}*/

/*
interface ParseError {
    message: string;
    errorTokenIndex: number;
}

class Parser {
    private variables: VariableBank;

    constructor(variables: VariableBank) {
        this.variables = variables;
    }

    public parse(tokens: TokenTree[], errors: ParseError[]): IExpression {
        const operandStack = new Stack<IExpression>();
        const operatorStack = new Stack<Token>();
        let tokenIndex = 0;

        while (tokenIndex < tokens.length) {
            const token = tokens[tokenIndex];

            if (token.tokenType === TokenType.OpenParentheses) {
                const subExpr = Parser.getSubExpression(tokens, tokenIndex);
                operandStack.push(this.parse(subExpr, errors));
                continue;
            } else if (token.tokenType === TokenType.CloseParentheses) {
                errors.push({ message: "Mismatched parentheses in expression", errorTokenIndex: tokenIndex });
            }

            if (Parser.isOperator(token)) {
                while (!operatorStack.isEmpty() && token.tokenType < operatorStack.peek().tokenType) {
                    const op = operatorStack.pop();

                    switch (op.tokenType) {
                        case TokenType.Not:
                        case TokenType.PlusPlus:
                        case TokenType.MinMin: {
                            const op1 = operandStack.pop();
                            const nop = new SingleValueOperationExpression();
                            nop.value = op1;
                            nop.operator = op.tokenType;
                            operandStack.push(nop);
                            break;
                        }
                        default: {
                            const arg2 = operandStack.pop();
                            const arg1 = operandStack.pop();
                            const ex = new OperationExpression();
                            ex.left = arg1;
                            ex.operator = op.tokenType;
                            ex.right = arg2;
                            operandStack.push(ex);
                            break;
                        }
                    }
                }

                operatorStack.push(token);
            } else {
                switch (token.tokenType) {
                    case TokenType.SequenceTerminator:
                        break;
                    case TokenType.Variable: {
                        const expression = new VariableParseExpression();

                        const identifiers = token.value.split(".");
                        let root = this.variables.root;

                        for (let i = 0; i < identifiers.length; ++i) {
                            const identifier = identifiers[i];

                            if (root.containsMember(identifier)) {
                                root = root[identifier];
                            } else {
                                root = null;
                                errors.push({ message: `Variable does not exist: ${identifier}`, errorTokenIndex: tokenIndex });
                            }
                        }
                        expression.variable = root;
                        operandStack.push(expression);
                        break;
                    }
                    case TokenType.Boolean:
                    case TokenType.Number:
                    case TokenType.FloatingPointNumber:
                    case TokenType.StringValue: {
                        const expression = new ValueParseExpression();
                        expression.value = token.value;
                        expression.valueType = token.tokenType;
                        operandStack.push(expression);
                        break;
                    }
                    default:
                        throw new Error(`Missing expression value type: ${token.tokenType}`);
                }
            }

            tokenIndex++;
        }

        while (!operatorStack.isEmpty()) {
            const op = operatorStack.pop();

            switch (op.tokenType) {
                case TokenType.Not:
                case TokenType.PlusPlus:
                case TokenType.MinMin: {
                    const op1 = operandStack.pop();
                    const nop = new SingleValueOperationExpression();
                    nop.value = op1;
                    nop.operator = op.tokenType;
                    operandStack.push(nop);
                    break;
                }
                default: {
                    const arg2 = operandStack.pop();
                    const arg1 = operandStack.pop();
                    const ex = new OperationExpression();
                    ex.left = arg1;
                    ex.operator = op.tokenType;
                    ex.right = arg2;
                    operandStack.push(ex);
                    break;
                }
            }
        }

        return operandStack.pop();
    }

    private static getSubExpression(tokens: Token[], index: number): Token[] {
        const subExpr: Token[] = [];
        let parenlevels = 1;

        index++;

        while (index < tokens.length && parenlevels > 0) {
            const token = tokens[index];

            if (tokens[index].tokenType === TokenType.OpenParentheses) {
                parenlevels += 1;
            }

            if (tokens[index].tokenType === TokenType.CloseParentheses) {
                parenlevels -= 1;
            }

            if (parenlevels > 0) {
                subExpr.push(token);
            }

            index += 1;
        }

        if (parenlevels > 0) {
            throw new Error("Mismatched parentheses in expression");
        }

        return subExpr;
    }

    private static isOperator(token: Token): boolean {
        return (
            token.tokenType === TokenType.Assign ||
            token.tokenType === TokenType.PlusAssign ||
            token.tokenType === TokenType.PlusPlus ||
            token.tokenType === TokenType.MinMin ||
            token.tokenType === TokenType.MinusAssign ||
            token.tokenType === TokenType.MultiplyAssign ||
            token.tokenType === TokenType.DivideAssign
        );
    }
}
*/
