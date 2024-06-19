// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';
import { PgConnect } from './pgconnect';

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

	const newFile = vscode.commands.registerCommand('postgresqlmegaset.crearArchivo', async () => {
    const archivo = await vscode.workspace.openTextDocument({ content: 'select * from dual;', language: 'sql' });
    await vscode.window.showTextDocument(archivo);
  });

	context.subscriptions.push(disposable, messa, dropAllInstances, newFile);
	
	vscode.window.registerTreeDataProvider('nodeDependencies', postgresProvider);
}

export function deactivate() {}
