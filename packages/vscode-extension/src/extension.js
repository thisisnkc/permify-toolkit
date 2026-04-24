"use strict";

const vscode = require("vscode");
const { getSchemaDiagnostics } = require("@permify-toolkit/core");

function activate(context) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("perm");
  context.subscriptions.push(diagnosticCollection);

  const validate = (document) => {
    if (document.languageId !== "perm") {
      return;
    }

    const diagnostics = getSchemaDiagnostics(document.getText());
    const vscodeDiagnostics = diagnostics.map((diagnostic) => {
      const range = toVsCodeRange(document, diagnostic.location);
      const severity =
        diagnostic.severity === "error"
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning;
      const item = new vscode.Diagnostic(range, diagnostic.message, severity);
      item.source = "Permify";
      item.code = diagnostic.code;
      return item;
    });

    diagnosticCollection.set(document.uri, vscodeDiagnostics);
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validate),
    vscode.workspace.onDidSaveTextDocument(validate),
    vscode.workspace.onDidChangeTextDocument((event) =>
      validate(event.document)
    ),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        validate(editor.document);
      }
    })
  );

  vscode.window.visibleTextEditors.forEach((editor) =>
    validate(editor.document)
  );
}

function deactivate() {}

function toVsCodeRange(document, location) {
  if (!location) {
    return new vscode.Range(0, 0, 0, 1);
  }

  const startLine = clamp(location.start.line - 1, 0, document.lineCount - 1);
  const endLine = clamp(location.end.line - 1, 0, document.lineCount - 1);
  const startCharacter = clamp(
    location.start.column - 1,
    0,
    document.lineAt(startLine).text.length
  );
  const endCharacter = clamp(
    Math.max(location.end.column - 1, startCharacter + 1),
    0,
    document.lineAt(endLine).text.length
  );

  return new vscode.Range(startLine, startCharacter, endLine, endCharacter);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = {
  activate,
  deactivate
};
