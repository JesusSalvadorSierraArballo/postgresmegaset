// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';
import { PgConnect } from './pgconnect';
import { obtenerHtmlParaWebview } from './Webview/queryResults';

export async function activate(context: vscode.ExtensionContext) {
	const myStorage = new Storage(context);
	const postgresProvider = new PostgresProvider(context);
	let panel: vscode.WebviewPanel | undefined;

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

	vscode.commands.registerCommand('postgresqlmegaset.runSentence', async () =>{

		if (vscode.window.activeTextEditor) {
			let documento = vscode.window.activeTextEditor.document;
			let texto = documento.getText();
			vscode.window.showInformationMessage(texto);

			const res = await (new PgConnect('testuser', 'testpasssword', 'testhost', 5432, 'testdatabase')).runQuery(texto);
			if(!res?.rows?.length){
				return;
			}
			
			if (panel && !panel.visible) {
				panel.dispose();
				panel = undefined;
			}

			if (panel) {
					panel.webview.html = obtenerHtmlParaWebview(Object.keys(res.rows[0]), res.rows);
			} else {
					panel = vscode.window.createWebviewPanel(
							'pokemon',  
							'Results', 
							vscode.ViewColumn.Beside, 
							{}
					);
					panel.webview.html = obtenerHtmlParaWebview(Object.keys(res.rows[0]), res.rows);
					panel.onDidDispose(() => {
							panel = undefined;
					}, null, context.subscriptions);
			}
		}
	});

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

	const getTableCode = vscode.commands.registerCommand('postgresqlmegaset.getTableCode', (elemento) => {
    vscode.window.showInformationMessage('Información copiada al portapapeles');
  });

	const newFile = vscode.commands.registerCommand('postgresqlmegaset.crearArchivo', async () => {
    const archivo = await vscode.workspace.openTextDocument({ content: 'select * from user', language: 'sql' });
    await vscode.window.showTextDocument(archivo);
  });
	


	context.subscriptions.push(disposable, messa, dropAllInstances, newFile, getTableCode);
	
	vscode.window.registerTreeDataProvider('nodeDependencies', postgresProvider);
}

export function deactivate() {}
