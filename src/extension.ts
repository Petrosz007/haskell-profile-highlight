import * as vscode from 'vscode';
import { getHighlightsFromFile } from './profile-parser';

let decorations: any = {};
let decorationStyles: any = {};
let highlightToggled = false;
let profileSource: string;
let hasProfilePath = false;

function removeDecorations(editor: vscode.TextEditor) {
	Object.keys(decorations).forEach(decor => {
		editor.setDecorations(decorationStyles[decor], []);
	});

	decorations = {};
}

function updateDecorations(editor: vscode.TextEditor) {
	Object.keys(decorations).forEach(decor => {
		console.log("   ", decorationStyles[decor], decorations[decor], decorationStyles[decor].backgroundColor);
		editor.setDecorations(decorationStyles[decor], decorations[decor]);
	});
}

async function changeProfilePath() {
	const result = await vscode.window.showInputBox({
		prompt: "Enter the full path of the profile.json file.",
		ignoreFocusOut: true,
	});

	if(result === undefined) {
		vscode.window.showInformationMessage('Plase enter a valid path!');
		return;
	}

	profileSource = result;
	hasProfilePath = true;

	return;
}

export function activate(context: vscode.ExtensionContext) {

	let disposables: vscode.Disposable[] = [];
	disposables.push(vscode.commands.registerCommand('extension.toggleHighlight', async () => {
		const editor = vscode.window.activeTextEditor;
		if(!editor) { return; }

		if(!hasProfilePath) {
			await changeProfilePath();
		}

		highlightToggled = !highlightToggled;

		if(!highlightToggled) {
			removeDecorations(editor);
			vscode.window.showInformationMessage('Removed highlight!');
			return;
		}

		const highlights = getHighlightsFromFile(profileSource);

		removeDecorations(editor);

		highlights.forEach(highlight => {
			if(!decorationStyles[highlight.opacityPercentage]) {
					decorationStyles[highlight.opacityPercentage] = vscode.window.createTextEditorDecorationType({
						backgroundColor: `rgba(255, 0, 0, ${highlight.opacityPercentage})`
					});
			}

			if(!decorations[highlight.opacityPercentage]) { 
				decorations[highlight.opacityPercentage] = [];
			}

			decorations[highlight.opacityPercentage].push(
				new vscode.Location(editor.document.uri, new vscode.Range(highlight.startPosition, highlight.endPosition))
			);
		});

		updateDecorations(editor);

		vscode.window.showInformationMessage('Added highlight!');
	}));

	disposables.push(vscode.commands.registerCommand('extension.changeProfilePath', async () => {
		await changeProfilePath();
		vscode.window.showInformationMessage('Changed profile path!');
	}));

	disposables.forEach(d => context.subscriptions.push(d));
}

export function deactivate() {}
