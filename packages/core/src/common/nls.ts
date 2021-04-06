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

export interface LocalizeInfo {
    readonly key: string;
    readonly comment: string[];
}

export namespace nls {

    /**
     * Localize a message.
     *
     * `message` can contain `{n}` notation where it is replaced by the nth value in `...args`
     * For example, `localize('sayHello', 'hello {0}', name)`
     */
    export function localize(key: string, message: string, ...args: (string | number | boolean | undefined | null)[]): string;

    /**
     * Localize a message.
     *
     * `message` can contain `{n}` notation where it is replaced by the nth value in `...args`
     * For example, `localize({ key: 'sayHello', comment: ['Welcomes user'] }, 'hello {0}', name)`
     */
    export function localize(info: LocalizeInfo, message: string, ...args: (string | number | boolean | undefined | null)[]): string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function localize(infoOrKey: any, message: string, ...args: (string | number | boolean | undefined | null)[]): string {
        return '';
    }

}
