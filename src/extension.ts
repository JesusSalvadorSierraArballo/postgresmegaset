import * as vscode from 'vscode';
import { Database, PostgresProvider } from './postgresStructure';
import { Storage } from './repositories/storage';
import { PgConnect } from './pgconnect';
import { getERDiagram, obtenerHtmlParaWebview } from './Webview/queryResults';
import { WorkspaceState } from './repositories/workspaceState';
import { Table } from './schemaTreeItems/Table';
import { Procedure } from './schemaTreeItems/Procedure';
import { Instance } from './schemaTreeItems/Instance';

export async function activate(context: vscode.ExtensionContext) {
	const myStorage = new Storage(context);
	const myEr = new WorkspaceState(context);
	const postgresProvider = new PostgresProvider(context);
	let panelResults: vscode.WebviewPanel | undefined;
	const documentInstanceMap = new Map<vscode.TextDocument, Database>();
	let panelER: vscode.WebviewPanel | undefined; 

	const messa = vscode.commands.registerCommand('postgresqlmegaset.showConnections', async () => {
		const conn = await myStorage.getConnections();
		vscode.window.showInformationMessage(JSON.stringify(conn));
	});

	const dropAllInstances = vscode.commands.registerCommand('postgresqlmegaset.dropAllConnections', async () => {
		const conn = await myStorage.dropAllConnections();
		postgresProvider.refresh();
		vscode.window.showInformationMessage(JSON.stringify(conn));
	});

	vscode.commands.registerCommand('postgresqlmegaset.refreshEntry', () => postgresProvider.refresh());

const addTableToER = vscode.commands.registerCommand('postgresqlmegaset.addTableToER', async (table: Table) => {
	const tableStructure = await table.getTableStructure();
	await myEr.addTable(tableStructure);
	let allMyTables = await myEr.getTablesInER();

	if (panelER && !panelER.visible) {
	  panelER.dispose();
	  panelER = undefined;
	}
	
	if (panelER) {
			panelER.webview.html = getERDiagram(allMyTables);
	} else {
			panelER = vscode.window.createWebviewPanel(
				'Er',
				'Er',
				vscode.ViewColumn.Beside,
				{
						enableScripts: true
				}
		);

		panelER.webview.html = getERDiagram(allMyTables);
			panelER.onDidDispose(() => {
					panelER = undefined;
			}, null, context.subscriptions);
	}
});

const deleteAllTableToER = vscode.commands.registerCommand('postgresqlmegaset.deleteAllTableInER', async () => {
	await myEr.dropAllTablesInER();
});

const deleteTableInER = vscode.commands.registerCommand('postgresqlmegaset.deleteTableInER', async (table: Table) => {
	const tableer = await table.getTableStructure();
	await myEr.deleteTable(tableer);
	let allMyTables = await myEr.getTablesInER();

	if (panelER && !panelER.visible) {
	  panelER.dispose();
	  panelER = undefined;
	}
	
	if (panelER) {
			panelER.webview.html = getERDiagram(allMyTables);
	} else {
			panelER = vscode.window.createWebviewPanel(
				'Er',
				'Er',
				vscode.ViewColumn.Beside,
				{
						enableScripts: true
				}
		);

		panelER.webview.html = getERDiagram(allMyTables);
			panelER.onDidDispose(() => {
					panelER = undefined;
			}, null, context.subscriptions);
	}
});

const getProcedureSource = vscode.commands.registerCommand('postgresqlmegaset.getProcedureSource',  async (procedure: Procedure) => {
	vscode.window.showInformationMessage(`postgresqlmegaset.getProcedureSource ${procedure.label} ${typeof procedure}`);
		const source = await procedure.getSource();
		const file = await vscode.workspace.openTextDocument({ content: source, language: 'sql' });
    const editor = await vscode.window.showTextDocument(file);
		//documentInstanceMap.set(editor.document, procedure.);
});

	
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
			
			if (panelResults && !panelResults.visible) {
				panelResults.dispose();
				panelResults = undefined;
			}
			
			if (panelResults) {
				panelResults.webview.html = "";
				for(let res of datasets) {
					panelResults.webview.html += obtenerHtmlParaWebview(res.fields.map(({name}:{name: string}) => name ), res.rows);
				}
			} else {
					panelResults = vscode.window.createWebviewPanel(
							'resultsWebview',  
							'Results', 
							vscode.ViewColumn.Beside, 
							{}
					);
					for(let res of datasets) {
						panelResults.webview.html += obtenerHtmlParaWebview(res.fields.map(({name}: {name: string}) => name ), res.rows);
					}
					panelResults.onDidDispose(() => {
							panelResults = undefined;
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
	const getTableCode = vscode.commands.registerCommand('postgresqlmegaset.getTableCode', async (element) => {
		const file = await vscode.workspace.openTextDocument({ content: '', language: 'sql' });
    const editor = await vscode.window.showTextDocument(file);
		documentInstanceMap.set(editor.document, element);
  });

	const newFile = vscode.commands.registerCommand('postgresqlmegaset.newFile', async (element: Database) => {
    const file = await vscode.workspace.openTextDocument({ content: '', language: 'sql' });
    const editor = await vscode.window.showTextDocument(file);
		documentInstanceMap.set(editor.document, element);
  });

	const deleteInstance = vscode.commands.registerCommand('postgresqlmegaset.deleteInstance', async (instance: Instance) => {
		await myStorage.dropConnections(instance);
		postgresProvider.refresh();
	}
);

const getTemplateSelectTop = vscode.commands.registerCommand('postgresqlmegaset.getSelectTopTemplate',  async (table: Table) => {
	const source = await table.getSelectTop();
		const file = await vscode.workspace.openTextDocument({ content: source, language: 'sql' });
    const editor = await vscode.window.showTextDocument(file);
		//documentInstanceMap.set(editor.document, table);
});

	context.subscriptions.push(
		disposable, 
		messa, 
		dropAllInstances, 
		newFile, 
		getTableCode, 
		addTableToER, 
		deleteTableInER,
		deleteAllTableToER,
		getProcedureSource, 
		deleteInstance,
		getTemplateSelectTop
	);
	vscode.window.registerTreeDataProvider('schemaTree', postgresProvider);
}

export function deactivate() {}
