/********************************************************************************
 * Copyright (C) 2019 Arm and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject, postConstruct, ContainerModule } from 'inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';

import '../../src/browser/style/branding.css';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MessageService } from '@theia/core/lib/common';

export default new ContainerModule(bind => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bind(UserPreferencesTest).toSelf().inSingletonScope();
    bind(CommandContribution).toService(UserPreferencesTest);
});

@injectable()
export class UserPreferencesTest implements CommandContribution {

    @inject(PreferenceService) preferences: PreferenceService;
    @inject(MessageService) messages: MessageService;

    @postConstruct()
    protected init(): void {
        this.preferences.ready.then(() => this.messages.info(`editor.fontSize from postConstruct: ${this.preferences.get<number>('editor.fontSize')}`));
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({ id: 'set-editor-font-size-to-20', label: 'Set editor.fontSize to 20 in user preferences.' }, {
            execute: async () => {
                await this.preferences.ready;
                this.preferences.set('editor.fontSize', 20, PreferenceScope.User);
            }
        });
        registry.registerCommand({ id: 'get-editor-font-size', label: 'Get the editor.fontSize from the preferences' }, {
            execute: async () => {
                await this.preferences.ready;
                this.messages.info(`editor.fontSize: ${this.preferences.get<number>('editor.fontSize')}`);
            }
        });
    }

}
