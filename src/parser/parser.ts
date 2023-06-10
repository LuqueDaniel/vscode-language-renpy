/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TextDocument } from "vscode";
import { ExpressionNode } from "./ast-nodes";
import { ExpressionRule } from "./grammar-rules";
import { tokenizeDocument } from "../tokenizer/tokenizer";
import { CharacterTokenType, MetaTokenType, TokenType } from "../tokenizer/renpy-tokens";
import { Token, TokenPosition, TokenTreeIterator, tokenTypeToStringMap } from "../tokenizer/token-definitions";
import { Vector } from "../utilities/vector";
import { LogCategory, LogLevel, logCatMessage } from "../logger";

export const enum ParseErrorType {
    UnexpectedToken,
    UnexpectedEndOfFile,
}

export interface ParseError {
    type: ParseErrorType;
    currentToken: Token;
    nextToken: Token;
    expectedTokenType: TokenType | null;
}

export class DocumentParser {
    private _it: TokenTreeIterator;
    private _document: TextDocument;
    private _currentToken: Token = null!;

    private _errors: Vector<ParseError> = new Vector<ParseError>();

    private INVALID_TOKEN = new Token(MetaTokenType.Invalid, new TokenPosition(0, 0, -1), new TokenPosition(0, 0, -1));

    constructor(document: TextDocument) {
        this._document = document;
        const tree = tokenizeDocument(document);
        const nodes = tree.flatten();

        let printOut = "";
        for (const node of nodes) {
            printOut += node.toString() + "\n";
        }
        logCatMessage(LogLevel.Info, LogCategory.Parser, printOut, true);

        this._it = tree.getIterator();
        this._it.setFilter(new Set([MetaTokenType.Comment, CharacterTokenType.Whitespace]));

        // Advance so the iterator is pointing at the next token and our current token is the first token.
        this.next();
        this._currentToken = this.INVALID_TOKEN;
    }

    private addError(errorType: ParseErrorType, expectedToken: TokenType | null = null) {
        this._errors.pushBack({
            type: errorType,
            currentToken: this.current(),
            nextToken: this.peekNext(),
            expectedTokenType: expectedToken,
        });
    }

    public next() {
        if (!this._it.hasNext()) {
            this.addError(ParseErrorType.UnexpectedEndOfFile);
            return;
        }
        this._currentToken = this._it.token!;
        this._it.next();
    }

    public skipEmptyLines() {
        while (this.test(CharacterTokenType.NewLine)) {
            this.next();
        }
    }

    public hasNext(): boolean {
        return this._it.hasNext();
    }

    public skip() {
        this._it.skip();
    }

    public currentTokenValue(): string {
        return this.current().getValue(this._document);
    }

    public currentTokenType() {
        return this.current().type;
    }

    public peekNextTokenType() {
        return this.peekNext().type;
    }

    public current() {
        return this._currentToken;
    }

    public peekNext() {
        return this._it.token ?? this.INVALID_TOKEN;
    }

    public test(tokenType: TokenType) {
        return this.peekNextTokenType() === tokenType;
    }

    public testValue(value: string) {
        return this.peekNext()?.getValue(this._document) === value ?? false;
    }

    public require(tokenType: TokenType) {
        if (this.test(tokenType)) {
            this.next();
            return true;
        }
        this.addError(ParseErrorType.UnexpectedToken, tokenType);
        return false;
    }

    public optional(tokenType: TokenType): boolean {
        if (this.test(tokenType)) {
            this.next();
            return true;
        }
        return false;
    }

    public parseExpression(): ExpressionNode | null {
        const rule = new ExpressionRule();
        return rule.parse(this);
    }

    public getErrorMessage(error: ParseError) {
        switch (error.type) {
            case ParseErrorType.UnexpectedEndOfFile:
                return "Unexpected end of file";
            case ParseErrorType.UnexpectedToken:
                return `Expected token of type '${this.getTokenTypeString(error.expectedTokenType)}', but got '${this.getTokenTypeString(error.currentToken.type)}'`;
        }
    }

    public getTokenTypeString(tokenType: TokenType | null) {
        if (tokenType === null) {
            return "None";
        }

        return tokenTypeToStringMap[tokenType];
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
