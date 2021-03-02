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

import { injectable, ContainerModule } from 'inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { bindVSXCommand } from './vsx/sample-vsx-command-contribution';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { workspacePreferenceSchema, WorkspacePreferencesSchemaProvider } from '@theia/workspace/lib/browser/workspace-preferences';

import '../../src/browser/style/branding.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bindVSXCommand(bind);
    bind(MyWorkspacePreferencesSchemaProvider).toSelf().inSingletonScope();
    rebind(WorkspacePreferencesSchemaProvider).toService(MyWorkspacePreferencesSchemaProvider);
});

@injectable()
class MyWorkspacePreferencesSchemaProvider extends WorkspacePreferencesSchemaProvider {

    get schema(): PreferenceSchema {
        const schema = workspacePreferenceSchema;
        delete schema.properties['workspace.preserveWindow'];
        return schema;
    }

}
