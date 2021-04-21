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

import { ContainerModule, inject, injectable } from '@theia/core/shared/inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { bindVSXCommand } from './vsx/sample-vsx-command-contribution';
import { SomeService, SomeServicePath } from '../common/some-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider';

import '../../src/browser/style/branding.css';

export default new ContainerModule(bind => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bindVSXCommand(bind);
    bind(CommandContribution).to(SomeCommandContribution).inSingletonScope(); // Note: this command is contributed by a VS Code extension.
    bind(SomeService).toDynamicValue(({ container }) => WebSocketConnectionProvider.createProxy(container, SomeServicePath)).inSingletonScope();
});

@injectable()
class SomeCommandContribution implements CommandContribution {

    @inject(SomeService)
    protected readonly someService: SomeService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand({ id: 'some-command-that-comes-from-vscode' }, {
            execute: (arg: string) => arg.toLocaleUpperCase()
        });
        commands.registerCommand({ id: 'some-command-id', label: 'Execute example - Call CommandService on the backend' }, {
            execute: () => this.someService.doSomething({ options: navigator.language }).then(({ data }) => this.messageService.info('result from the backend: ' + data))
        });
    }

}
