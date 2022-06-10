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
import { CommandContribution, CommandRegistry } from '@theia/core';
import { EditorManager } from '@theia/editor/lib/browser';
import { ApplicationShell, FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';

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
    bind(RevealInEditorContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(RevealInEditorContribution);
    bind(FrontendApplicationContribution).toService(RevealInEditorContribution);
});

@injectable()
class RevealInEditorContribution implements CommandContribution, FrontendApplicationContribution {

    @inject(EditorManager)
    private readonly editorManager: EditorManager;
    private shell: ApplicationShell;

    onStart(app: FrontendApplication): void {
        this.shell = app.shell;
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand({ id: 'reveal-in-editor', label: 'Reveal in editor' }, {
            execute: async () => {
                const current = this.editorManager.currentEditor;
                const active = this.editorManager.activeEditor;
                const hidden = this.editorManager.all.filter(editor => editor !== current && editor !== active)[0];
                if (!hidden) {
                    console.warn('Please open at least two editors');
                } else {
                    console.info('Revealing position in editor: ' + hidden.editor.uri);
                    this.editorManager.getByUri(hidden.editor.uri, { mode: 'activate', selection: { start: { line: 1, character: 1 } } });
                }
            }
        });
        commands.registerCommand({ id: 'reveal-in-editor2', label: 'Reveal in editor 2' }, {
            execute: async () => {
                const current = this.editorManager.currentEditor;
                const active = this.editorManager.activeEditor;
                const hidden = this.editorManager.all.filter(editor => editor !== current && editor !== active)[0];
                if (!hidden) {
                    console.warn('Please open at least two editors');
                } else {
                    await this.shell.activateWidget(hidden.id);
                    console.info('Revealing position in editor: ' + hidden.editor.uri);
                    hidden.editor.revealPosition({ line: 1, character: 1 });
                }
            }
        });
    }

}
