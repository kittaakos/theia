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

import '../../src/browser/style/branding.css';

import { postConstruct, inject, injectable, ContainerModule } from 'inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { bindVSXCommand } from './vsx/sample-vsx-command-contribution';
import { Send, SendPath } from '../common/send';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';

export default new ContainerModule(bind => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bindVSXCommand(bind);
    bind(Send).toDynamicValue(({ container }) => WebSocketConnectionProvider.createProxy(container, SendPath)).inSingletonScope();
    bind(SendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(SendContribution);
});

@injectable()
class SendContribution implements CommandContribution {

    @inject(Send)
    protected readonly send: Send;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @postConstruct()
    protected init(): void {
        const requestMessage = () => {
            this.send.requestMessage().then(({ text }) => {
                this.commandRegistry.executeCommand(OutputCommands.APPEND_LINE.id, { name: 'API Sample: Send', text });
                requestMessage();
            });
        };
        requestMessage();
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({ id: 'send--toggle-messages', label: 'Toggle messages from backend', category: 'API Sample: Send' }, {
            execute: async () => this.send.toggleMessages()
        });
    }

}
