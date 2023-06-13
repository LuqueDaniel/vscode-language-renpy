import { DocumentParser } from "./parser";
import { window } from "vscode";
import { RenpyStatementRule } from "./renpy-grammar-rules";
import { AST } from "./ast-nodes";

export function testParser() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const state = new DocumentParser(activeEditor.document);
    const statementParser = new RenpyStatementRule();
    const ast = new AST();

    while (state.hasNext()) {
        state.skipEmptyLines();

        if (statementParser.test(state)) {
            ast.append(statementParser.parse(state));
            state.expectEOL();
        }

        if (state.hasNext()) {
            state.next();
        }
    }

    state.printErrors();

    /*const rule = new ExpressionRule();
    const ast = rule.parse(state);

    logCatMessage(LogLevel.Info, LogCategory.Parser, JSON.stringify(ast, null, 2), true);*/
}
