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
import { Emitter } from '@theia/core/lib/common/event';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { Send, SendPath } from '../common/send';

export default new ContainerModule(bind => {
    bind(ConnectionContainerModule).toConstantValue(ConnectionContainerModule.create(({ bind, bindBackendService }) => {
        bind(SendServer).toSelf().inSingletonScope();
        bind(Send).toService(SendServer);
        bindBackendService(SendPath, Send);
    }));
});

@injectable()
class SendServer implements Send {

    protected onDidOfferEmitter = new Emitter<void>();
    protected messages: string[] = [];
    protected timeout?: NodeJS.Timeout;

    toggleMessages(): void {
        if (this.timeout) {
            this.stop();
        } else {
            this.timeout = setInterval(() => this.queue(), 1);
        }
    }

    async requestMessage(): Promise<{ text: string }> {
        const first = this.messages.shift();
        if (first) {
            return { text: first };
        }
        return new Promise<{ text: string }>(resolve => {
            const toDispose = this.onDidOfferEmitter.event(() => {
                toDispose.dispose();
                resolve(this.requestMessage());
            });
        });
    }

    private stop(): void {
        if (this.timeout) {
            this.messages.length = 0;
            clearInterval(this.timeout);
            this.timeout = undefined;
        }
    }

    private queue(text: string = `${Date.now()}`): void {
        this.messages.push(text);
        this.onDidOfferEmitter.fire();
    }

}
