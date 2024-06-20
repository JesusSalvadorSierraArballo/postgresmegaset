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

	vscode.commands.registerCommand('postgresqlmegaset.runSentence', async () => {
		if (vscode.window.activeTextEditor) {
			let editor = vscode.window.activeTextEditor;
			let text = editor.document.getText(editor.selection) || editor.document.getText();
			const sentences = text.replaceAll('\r\n', ' ').split(';').filter(Boolean);
			
			//TODO CHOSE A CONNECTION BY CONTEX FILE
			const datasets = await Promise.all(sentences.map(async (s)=> await (new PgConnect('testuser', 'testpasssword', 'testhost', 5432, 'testdatabase')).runQuery(s)));
			//TODO: ADD TRY AND CATCH 
			if (panel && !panel.visible) {
				panel.dispose();
				panel = undefined;
			}
			
			if (panel) {
				panel.webview.html = "";
				for(let res of datasets) {
					panel.webview.html += obtenerHtmlParaWebview(Object.keys(res.rows[0]), res.rows);
				}
			} else {
					panel = vscode.window.createWebviewPanel(
							'pokemon',  
							'Results', 
							vscode.ViewColumn.Beside, 
							{}
					);
					for(let res of datasets) {
						panel.webview.html += obtenerHtmlParaWebview(Object.keys(res.rows[0]), res.rows);
					}
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

	//TODO
	const getTableCode = vscode.commands.registerCommand('postgresqlmegaset.getTableCode', (elemento) => {
    vscode.window.showInformationMessage('Información copiada al portapapeles');
  });

	//TODO: add context instance to file
	const newFile = vscode.commands.registerCommand('postgresqlmegaset.crearArchivo', async () => {
    const archivo = await vscode.workspace.openTextDocument({ content: '', language: 'sql' });
    await vscode.window.showTextDocument(archivo);
  });
	


	context.subscriptions.push(disposable, messa, dropAllInstances, newFile, getTableCode);
	
	vscode.window.registerTreeDataProvider('nodeDependencies', postgresProvider);
}

export function deactivate() {}
