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

import { injectable, interfaces, ContainerModule } from 'inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser/workspace-frontend-contribution';

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bind(MyWorkspaceFrontendContribution).toSelf().inSingletonScope();
    rebind(WorkspaceFrontendContribution).toService(MyWorkspaceFrontendContribution);
});

@injectable()
class MyWorkspaceFrontendContribution extends WorkspaceFrontendContribution {

    private blacklist = [
        WorkspaceCommands.OPEN,
        WorkspaceCommands.OPEN_FILE,
        WorkspaceCommands.OPEN_FOLDER,
        WorkspaceCommands.OPEN_WORKSPACE,
        WorkspaceCommands.OPEN_RECENT_WORKSPACE,
    ];

    // If you want to remove the backing functionality from the app, unregister the commands.
    // If you do this, you won't be able to execute the command, such as `Open Workspace...` from the _Command Palette_.
    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        for (const command of this.blacklist) {
            registry.unregisterCommand(command);
        }
    }

    // If you want to remove the menu items from the UI, keep the commands and remove the menu items.
    // You will be able to execute `Open Workspace...` from the _Command Palette_ but the menu item will be removed from the `File` menu.
    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        for (const command of this.blacklist) {
            registry.unregisterMenuAction({ commandId: command.id });
        }
    }

}
