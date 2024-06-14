// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const myStorage = new Storage(context);

	const messa = vscode.commands.registerCommand('hellojssa.showConnections', async () => {
		const conn = await myStorage.getConnections();
		vscode.window.showInformationMessage(JSON.stringify(conn));
	});
	const disposable = vscode.commands.registerCommand('hellojssa.helloDude', async () => {

	    let user = await vscode.window.showInputBox({title: 'User'}) || 'postgres';
	    let password = await vscode.window.showInputBox({title: 'password'}) || 'postgres';
	    let host = await vscode.window.showInputBox({title: 'host'});
	    let port = await vscode.window.showInputBox({title: 'port'}) || '5334';

		myStorage.saveConection(
			user,
			password,
			host,
			+port
		);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(messa);
	
  	vscode.window.registerTreeDataProvider('nodeDependencies', new PostgresProvider("C:/Users/jssa/Documents/repos/example/"));
}

// This method is called when your extension is deactivated
export function deactivate() {}
