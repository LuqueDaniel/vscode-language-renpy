import { DocumentParser } from "./parser";
import { KeywordTokenType } from "../tokenizer/renpy-tokens";
import { window } from "vscode";
import { DefineStatementRule } from "./renpy-grammar-rules";

export function testParser() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const state = new DocumentParser(activeEditor.document);

    while (state.hasNext()) {
        state.skipEmptyLines();

        if (DefineStatementRule.test(state)) {
            DefineStatementRule.parse(state);
        }

        state.next();
    }

    /*const rule = new ExpressionRule();
    const ast = rule.parse(state);

    logCatMessage(LogLevel.Info, LogCategory.Parser, JSON.stringify(ast, null, 2), true);*/
}
