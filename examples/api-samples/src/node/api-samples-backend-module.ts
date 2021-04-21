/********************************************************************************
 * Copyright (C) 2021 TypeFox and others.
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

import { injectable, ContainerModule, inject } from '@theia/core/shared/inversify';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { SomeService, SomeServicePath } from '../common/some-service';
import { CommandService } from '@theia/core/lib/common';

export default new ContainerModule(bind => {
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(SomeServiceImpl).toSelf().inSingletonScope();
        bind(SomeService).toService(SomeServiceImpl);
        bindBackendService(SomeServicePath, SomeService);
    }));
});

@injectable()
class SomeServiceImpl implements SomeService {

    @inject(CommandService)
    protected readonly commandService: CommandService;

    async doSomething({ options }: { options: string; }): Promise<{ data: string; }> {
        const result = await this.commandService.executeCommand<string>('some-command-that-comes-from-vscode', options);
        return { data: result! };
    }

}
