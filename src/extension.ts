// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';
import { PgConnect } from './pgconnect';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const myStorage = new Storage(context);
	const postgresProvider = new PostgresProvider(context);

	const messa = vscode.commands.registerCommand('postgresqlmegaset.showConnections', async () => {
		const conn = await myStorage.getConnections();
		vscode.window.showInformationMessage(JSON.stringify(conn));
	});

	const dropAllInstances = vscode.commands.registerCommand('postgresqlmegaset.dropAllConnections', async () => {
		const conn = await myStorage.dropAllConnections();
		postgresProvider.refresh();
		vscode.window.showInformationMessage(JSON.stringify(conn));
	});

	vscode.commands.registerCommand('postgresqlmegaset.refreshEntry', () =>
    postgresProvider.refresh()
  );


	const disposable = vscode.commands.registerCommand('postgresqlmegaset.setConnection', async () => {

	    let user = await vscode.window.showInputBox({title: 'User'}) || 'postgres';
	    let password = await vscode.window.showInputBox({title: 'password'}) || 'postgres';
	    let host = await vscode.window.showInputBox({title: 'host'}) || 'localhost';
	    let port = await vscode.window.showInputBox({title: 'port'}) || '5432';

		const connection = new PgConnect(
			user,
			password,
			host,
			+port);

		const hasConnection = await connection.testConnection();
		if(hasConnection)
		{
			myStorage.saveConection(
			user,
			password,
			host,
			+port
		).then(()=> postgresProvider.refresh());
		
		vscode.window.showInformationMessage('The connection was added');
		} else {
			vscode.window.showErrorMessage("Can'n connet to this server");
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(messa);
	context.subscriptions.push(dropAllInstances);
	
	vscode.window.registerTreeDataProvider('nodeDependencies', postgresProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
