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

import { injectable, ContainerModule } from 'inversify';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { Send, SendClient, SendPath } from '../common/send';

export default new ContainerModule(bind => {
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(SendServer).toSelf().inSingletonScope();
        bind(Send).toService(SendServer);
        bindBackendService<Send, SendClient>(SendPath, Send, (server, client) => {
            server.setClient(client);
            client.onDidCloseConnection(() => server.dispose());
            return server;
        });
    }));
});

@injectable()
class SendServer implements Send {

    protected client?: SendClient;
    protected timeout?: NodeJS.Timeout;

    async toggleMessages(): Promise<void> {
        if (this.timeout) {
            this.send('Stopping message stream.');
            this.dispose();
        } else {
            this.send('Starting message stream.');
            this.timeout = setInterval(() => this.send(), 1);
        }
    }

    setClient(client: SendClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }

    private send(text: string = `${Date.now()}`): void {
        if (this.client) {
            this.client.notify({ text });
        }
    }

}
