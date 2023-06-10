import { EntityTokenType, KeywordTokenType, LiteralTokenType, OperatorTokenType } from "../tokenizer/renpy-tokens";
import { ASTNode } from "./ast-nodes";
import { DocumentParser } from "./parser";

/**
 * define_operator = "+=" | "|=" | "=";
 * define_python_assignment_operation = define_operator, PYTHON_EXPRESSION;
 * define_identifier = DOTTED_NAME, ["[", PYTHON_EXPRESSION, "]"];
 * define = "define", INTEGER?, define_identifier, define_python_assignment_operation, NEWLINE;
 */
export class DefineStatementRule {
    public static test(state: DocumentParser): boolean {
        return state.test(KeywordTokenType.Define);
    }

    public static parse(state: DocumentParser): ASTNode | null {
        state.require(KeywordTokenType.Define);
        state.optional(LiteralTokenType.Integer);
        state.require(EntityTokenType.VariableName);
        state.require(OperatorTokenType.Assignment);

        return null;
    }
}
