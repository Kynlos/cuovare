import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { AIProviderManager } from './providers/AIProviderManager';
import { FileContextManager } from './context/FileContextManager';
import { ContextRetrievalEngine } from './context/ContextRetrievalEngine';
import { MCPManager } from './mcp/MCPManager';
import { ToolExecutionEngine } from './mcp/ToolExecutionEngine';

export function activate(context: vscode.ExtensionContext) {
    console.log('Cuovare AI Assistant is activating...');

    // Initialize core managers
    const aiProviderManager = new AIProviderManager(context);
    const fileContextManager = new FileContextManager();
    const contextRetrievalEngine = ContextRetrievalEngine.getInstance();
    const mcpManager = new MCPManager();
    const toolExecutionEngine = new ToolExecutionEngine(mcpManager);
    
    // Initialize the chat view provider
    const chatViewProvider = new ChatViewProvider(
        context.extensionUri, 
        aiProviderManager, 
        fileContextManager,
        contextRetrievalEngine,
        mcpManager,
        toolExecutionEngine
    );

    // Register the webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('cuovare.chatView', chatViewProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cuovare.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.cuovare');
        }),

        vscode.commands.registerCommand('cuovare.openSettings', () => {
            chatViewProvider.showSettings();
        }),

        vscode.commands.registerCommand('cuovare.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showErrorMessage('No code selected');
                return;
            }

            const selectedText = editor.document.getText(selection);
            const fileName = editor.document.fileName;
            
            await chatViewProvider.explainCode(selectedText, fileName);
            vscode.commands.executeCommand('workbench.view.extension.cuovare');
        }),

        vscode.commands.registerCommand('cuovare.generateCode', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'What code would you like me to generate?',
                placeHolder: 'e.g., Create a function that sorts an array...'
            });

            if (input) {
                await chatViewProvider.generateCode(input);
                vscode.commands.executeCommand('workbench.view.extension.cuovare');
            }
        }),

        vscode.commands.registerCommand('cuovare.reviewCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            const selection = editor.selection;
            const text = selection.isEmpty 
                ? editor.document.getText() 
                : editor.document.getText(selection);
            const fileName = editor.document.fileName;
            
            await chatViewProvider.reviewCode(text, fileName);
            vscode.commands.executeCommand('workbench.view.extension.cuovare');
        }),

        vscode.commands.registerCommand('cuovare.debugMCP', async () => {
            const status = mcpManager.getServerStatus();
            const tools = mcpManager.getAvailableTools();
            
            let statusText = '=== MCP Server Status ===\n\n';
            
            if (status.size === 0) {
                statusText += 'No MCP servers configured.\n\n';
                statusText += 'To add servers:\n';
                statusText += '1. Open Cuovare Chat\n';
                statusText += '2. Click Settings (gear icon)\n';
                statusText += '3. Go to MCP Servers section\n';
                statusText += '4. Click "Add" to configure a server\n';
            } else {
                status.forEach((serverInfo, serverName) => {
                    statusText += `${serverName}: ${serverInfo.status}`;
                    if (serverInfo.tools > 0) {
                        statusText += ` (${serverInfo.tools} tools)`;
                    }
                    if (serverInfo.lastError) {
                        statusText += ` - Error: ${serverInfo.lastError}`;
                    }
                    statusText += '\n';
                });
                
                statusText += `\n=== Available Tools (${tools.length}) ===\n\n`;
                if (tools.length === 0) {
                    statusText += 'No tools available. This could mean:\n';
                    statusText += '• Servers are not connected\n';
                    statusText += '• Servers don\'t provide any tools\n';
                    statusText += '• Connection failed during initialization\n\n';
                    statusText += 'Check the "Cuovare MCP Enhanced" output channel for detailed logs.\n';
                } else {
                    tools.forEach(tool => {
                        statusText += `• ${tool.name}: ${tool.description}\n`;
                        statusText += `  Server: ${tool.serverName || 'Unknown'}\n\n`;
                    });
                }
            }
            
            // Show in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: statusText,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(doc);
        })
    );

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cuovare')) {
                aiProviderManager.refreshConfiguration();
                mcpManager.refreshConfiguration();
            }
        })
    );

    // Initialize MCP servers
    mcpManager.initializeServers();

    console.log('Cuovare AI Assistant activated successfully!');
}

export function deactivate() {
    console.log('Cuovare AI Assistant deactivated');
}
