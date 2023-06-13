import { KeywordTokenType, OperatorTokenType } from "../tokenizer/renpy-tokens";
import { DefaultStatementNode, DefineStatementNode, LiteralNode, StatementNode } from "./ast-nodes";
import { AssignmentOperationRule, GrammarRule, IntegerLiteralRule, PythonExpressionRule, VariableNameRule } from "./grammar-rules";
import { DocumentParser } from "./parser";

const integerParser = new IntegerLiteralRule();
const variableNameParser = new VariableNameRule();
const pythonExpressionParser = new PythonExpressionRule();

/**
 * define_operator = "+=" | "|=" | "=";
 * define_python_assignment_operation = define_operator, PYTHON_EXPRESSION;
 * define_identifier = DOTTED_NAME, ["[", PYTHON_EXPRESSION, "]"];
 * define = "define", INTEGER?, define_identifier, define_python_assignment_operation, NEWLINE;
 */
export class DefineStatementRule extends GrammarRule<DefineStatementNode> {
    private allowedOperators = [OperatorTokenType.PlusAssign, OperatorTokenType.BitwiseOrAssign, OperatorTokenType.Assignment];
    private assignmentOperation = new AssignmentOperationRule(variableNameParser, this.allowedOperators, pythonExpressionParser);

    public test(state: DocumentParser) {
        return state.test(KeywordTokenType.Define);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(KeywordTokenType.Define);

        const offset = parser.optional(integerParser) ?? new LiteralNode(0);
        const assignmentOperation = parser.require(this.assignmentOperation);

        parser.expectEOL();

        return new DefineStatementNode(offset, assignmentOperation);
    }
}

/**
 * default = "default", INTEGER?, DOTTED_NAME, python_assignment_operation, NEWLINE;
 */
export class DefaultStatementRule extends GrammarRule<DefaultStatementNode> {
    private assignmentOperation = new AssignmentOperationRule(variableNameParser, [OperatorTokenType.Assignment], pythonExpressionParser);

    public test(state: DocumentParser) {
        return state.test(KeywordTokenType.Default);
    }

    public parse(parser: DocumentParser) {
        parser.requireToken(KeywordTokenType.Default);

        const offset = parser.optional(integerParser) ?? new LiteralNode(0);
        const assignmentOperation = parser.require(this.assignmentOperation);

        parser.expectEOL();

        return new DefaultStatementNode(offset, assignmentOperation);
    }
}

export class RenpyStatementRule extends GrammarRule<StatementNode> {
    rules = [new DefineStatementRule(), new DefaultStatementRule()];

    public test(state: DocumentParser) {
        for (const rule of this.rules) {
            if (rule.test(state)) {
                return true;
            }
        }

        return false;
    }

    public parse(parser: DocumentParser) {
        return parser.anyOf(this.rules);
    }
}
