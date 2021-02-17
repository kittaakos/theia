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
import { DirectoryArchiver } from '@theia/filesystem/lib/node/download/directory-archiver';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(MyDirectoryArchiver).toSelf().inSingletonScope();
    rebind(DirectoryArchiver).to(MyDirectoryArchiver);
});

@injectable()
export class MyDirectoryArchiver extends DirectoryArchiver {

    async archive(inputPath: string, outputPath: string, entries?: string[]): Promise<void> {
        console.log(`Use whatever lib to ZIP ${inputPath} into ${outputPath} with the following entries: ${entries ? entries.join(',') : ''}`);
        return super.archive(inputPath, outputPath, entries);
    }

};
