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
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { EditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser';
import { wait } from '@theia/core/lib/common/promise-util';

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
    bind(EditorOpenerOptionsContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(EditorOpenerOptionsContribution);
});

@injectable()
class EditorOpenerOptionsContribution implements FrontendApplicationContribution {

    @inject(EditorManager)
    private readonly editorManager: EditorManager;

    onStart(): void {
        this.editorManager.onCreated(async widget => {
            await wait(2000);
            const options = {
                counter: 0,
                mode: 'reveal',
                preview: false
            } as EditorOpenerOptions;
            console.log(`#1 Opening editor ${widget.editor.uri.toString()} with options: ${JSON.stringify(options)}`);
            await this.editorManager.open(widget.editor.uri, options);
            await wait(2000);
            const sameOptions = {
                ...options,
                preview: options.preview,
                mode: options.mode
            };
            console.log(`#2 Opening editor ${widget.editor.uri.toString()} with options: ${JSON.stringify(sameOptions)}`);
            await this.editorManager.open(widget.editor.uri, sameOptions);
        });
    }

}
