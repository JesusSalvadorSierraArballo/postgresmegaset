import * as vscode from 'vscode';
import { Database, PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';
import { PgConnect } from './pgconnect';
import { obtenerHtmlParaWebview } from './Webview/queryResults';

export async function activate(context: vscode.ExtensionContext) {
	const myStorage = new Storage(context);
	const postgresProvider = new PostgresProvider(context);
	let panel: vscode.WebviewPanel | undefined;
	const documentInstanceMap = new Map<vscode.TextDocument, Database>();

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
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			let { document } = editor;
			let text = document.getText(editor.selection) || document.getText();
			const sentences = text.replaceAll('\r\n', ' ').split(';').filter(Boolean);
			
			const cs = documentInstanceMap.get(document)?.server;
			if(!cs) {
				vscode.window.showInformationMessage("No conecction string");
				return;
			}
	 		
			let datasets: any[] = [];
			for (const s of sentences) {
			//TODO: ADD TRY AND CATCH 
					const res =  await (new PgConnect(cs.user, cs.password, cs.host, cs.port, cs.database)).runQuery(s);
					datasets = [...datasets, res];
			}
			
			if (panel && !panel.visible) {
				panel.dispose();
				panel = undefined;
			}
			
			if (panel) {
				panel.webview.html = "";
				for(let res of datasets) {
					panel.webview.html += obtenerHtmlParaWebview(res.fields.map(({name}:{name: string}) => name ), res.rows);
				}
			} else {
					panel = vscode.window.createWebviewPanel(
							'resultsWebview',  
							'Results', 
							vscode.ViewColumn.Beside, 
							{}
					);
					for(let res of datasets) {
						panel.webview.html += obtenerHtmlParaWebview(res.fields.map(({name}: {name: string}) => name ), res.rows);
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
	const newFile = vscode.commands.registerCommand('postgresqlmegaset.newFile', async (element: Database) => {
    const file = await vscode.workspace.openTextDocument({ content: '', language: 'sql' });
    const editor = await vscode.window.showTextDocument(file);
		documentInstanceMap.set(editor.document, element);
  });

	context.subscriptions.push(disposable, messa, dropAllInstances, newFile, getTableCode);
	vscode.window.registerTreeDataProvider('schemaTree', postgresProvider);
}

export function deactivate() {}
