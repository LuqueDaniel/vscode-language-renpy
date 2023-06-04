import { ExpressionRule } from "./grammar-rules";
import { ParserState } from "./parser";
import { LiteralTokenType, OperatorTokenType, TokenType } from "../tokenizer/renpy-tokens";

export class Token {
    public type: TokenType;
    public value: any;

    constructor(type: TokenType, value: any) {
        this.type = type;
        this.value = value;
    }
}

export function testParser() {
    const tokens = [new Token(LiteralTokenType.Integer, 2), new Token(OperatorTokenType.Plus, "+"), new Token(LiteralTokenType.Integer, 4), new Token(OperatorTokenType.Multiply, "*"), new Token(LiteralTokenType.Integer, 3)];

    const state = new ParserState(tokens);
    const rule = new ExpressionRule();
    const ast = rule.parse(state);

    console.log(JSON.stringify(ast, null, 2));
}
