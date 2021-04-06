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

import { config } from 'vscode-nls/browser';
import { nls } from '../common/nls';

export default new Promise<void>(resolve => {
    const locale = new URL(window.location.href).searchParams.get('locale') || navigator.language || navigator.languages[0];
    if (!locale) {
        console.warn('Could not determine locale. Falling back to default.');
    } else {
        console.info(`Using '${locale}' locale.`);
    }
    nls.localize = config({ locale })();
    resolve();
});
