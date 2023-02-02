// *****************************************************************************
// Copyright (C) 2019 Arm and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

import { ContainerModule, inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleFilteredCommandContribution } from './contribution-filter/sample-filtered-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { bindVSXCommand } from './vsx/sample-vsx-command-contribution';
import { bindSampleToolbarContribution } from './toolbar/sample-toolbar-contribution';

import '../../src/browser/style/branding.css';
import { bindMonacoPreferenceExtractor } from './monaco-editor-preferences/monaco-editor-preference-extractor';
import URI from '@theia/core/lib/common/uri';
import { CommandContribution, CommandRegistry, CommandService } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MessageService } from '@theia/core/lib/common/message-service';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';

export default new ContainerModule((
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind,
) => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bindVSXCommand(bind);
    bindSampleFilteredCommandContribution(bind);
    bindSampleToolbarContribution(bind, rebind);
    bindMonacoPreferenceExtractor(bind);
    bind(ToastCurrentEditorContributions).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ToastCurrentEditorContributions);
    bind(KeybindingContribution).toService(ToastCurrentEditorContributions);
});

@injectable()
class ToastCurrentEditorContributions implements CommandContribution, KeybindingContribution {
    @inject(EditorManager) private readonly editorManager: EditorManager;
    @inject(MessageService) private readonly messageService: MessageService;
    @inject(CommandService) private readonly commandService: CommandService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({ id: 'api-sample-toast-current-editor' }, {
            execute: () => this.messageService.info(
                `Current editor URI: ${this.currentEditorUri?.toString()}`,
                { timeout: 2_000 }
            )
        });
        registry.registerCommand({ id: 'api-sample-rename-current-editor' }, {
            execute: () => this.commandService.executeCommand(WorkspaceCommands.FILE_RENAME.id, [this.currentEditorUri]),
            isEnabled: () => Boolean(this.currentEditorUri)
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: 'api-sample-toast-current-editor',
            keybinding: 'ctrlcmd+k k'
        });
        registry.registerKeybinding({
            command: 'api-sample-rename-current-editor',
            keybinding: 'ctrlcmd+k r'
        });
    }

    private get currentEditorUri(): URI | undefined {
        return this.editorManager.currentEditor?.getResourceUri();
    }
}
