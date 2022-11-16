// *****************************************************************************
// Copyright (C) 2022 Arduino SA and others.
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

import type {
    ContextKeyValue
} from '@theia/core/lib/browser/context-key-service';
import { CommandContribution, CommandRegistry, MessageService, QuickInputService } from '@theia/core/lib/common';
import { inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { ContextKeyService } from '@theia/monaco-editor-core/esm/vs/platform/contextkey/browser/contextKeyService';

@injectable()
export class CheckWhenContextContribution implements CommandContribution {
    @inject(QuickInputService) private readonly quickInput: QuickInputService;
    @inject(MessageService) private readonly messageService: MessageService;
    @inject(ContextKeyService) private readonly contextKeyService: ContextKeyService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: 'sample-check-when-context-value',
            label: "Check 'when' clause context value", category: 'Examples'
        }, {
            execute: async () => {
                const key = await this.quickInput.input({
                    title: "Check 'when' clause context value",
                    placeHolder: "Type the key of the 'when' context clause and press Enter to show its value..."
                });
                if (key) {
                    const value = this.contextKeyService.getContextKeyValue<ContextKeyValue>(key);
                    this.messageService.info(`'${key}' when context value: ${value}`);
                }
            }
        });
    }
}

export const bindCheckWhenContextContribution = (bind: interfaces.Bind) => {
    bind(CommandContribution)
        .to(CheckWhenContextContribution)
        .inSingletonScope();
};
