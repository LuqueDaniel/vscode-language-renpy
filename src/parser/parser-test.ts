import { DocumentParser } from "./parser";
import { window } from "vscode";
import { RenpyStatementRule } from "./renpy-grammar-rules";
import { AST } from "./ast-nodes";
import { LogCategory, LogLevel, logCatMessage } from "../logger";
import { RpyProgram } from "../interpreter/program";

// Test decorations
const defDecorationType = window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    fontWeight: "bold",
    textDecoration: "underline wavy 1pt",
});

const refDecorationType = window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    textDecoration: "underline",
});

export async function testParser() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== "renpy") {
        return;
    }

    const state = new DocumentParser(activeEditor.document);
    await state.initialize();

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
    logCatMessage(LogLevel.Info, LogCategory.Parser, ast.toString(), true);

    const program = new RpyProgram();
    ast.process(program);

    const sym = program.globalScope.resolve("e");
    if (sym === null) {
        logCatMessage(LogLevel.Info, LogCategory.Parser, "Sym: null", true);
    } else {
        // highlight all sym.references in the active editor
        activeEditor.setDecorations(refDecorationType, sym.references.map((ref) => ref.range).toArray());
        activeEditor.setDecorations(defDecorationType, [sym.definitionLocation.range]);

        logCatMessage(LogLevel.Info, LogCategory.Parser, "Sym: " + sym.toString(), true);
    }
}
