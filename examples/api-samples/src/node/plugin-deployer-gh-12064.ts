// *****************************************************************************
// Copyright (C) 2021 Ericsson and others.
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

import { URI } from '@theia/core/lib/common/uri';
import { inject, injectable, interfaces, postConstruct } from '@theia/core/shared/inversify';
import { PluginDeployer, PluginDeployerResolver, PluginDeployerResolverContext } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { PluginDeployerImpl } from '@theia/plugin-ext/lib/main/node/plugin-deployer-impl';
import { LocalDirectoryPluginDeployerResolver } from '@theia/plugin-ext/lib/main/node/resolvers/local-directory-plugin-deployer-resolver';
import { constants, promises as fs } from 'fs';
import { isAbsolute, resolve } from 'path';

@injectable()
class MyLocalDirectoryPluginDeployerResolver extends LocalDirectoryPluginDeployerResolver {
    override async resolve(
        pluginResolverContext: PluginDeployerResolverContext
    ): Promise<void> {
        let localPath = await this.originalResolveLocalPluginPath(
            pluginResolverContext,
            this.supportedScheme
        );
        // If local plugins folder was not resoled, fallback to the hack.
        if (!localPath) {
            localPath = await resolveLocalPluginPath(
                pluginResolverContext,
                this.supportedScheme
            );
        }
        if (localPath) {
            await this.resolveFromLocalPath(pluginResolverContext, localPath);
        }
    }

    private async originalResolveLocalPluginPath(
        context: PluginDeployerResolverContext,
        scheme: string
    ): Promise<string | null> {
        const object = <Record<string, unknown>>this;
        if (
            'resolveLocalPluginPath' in object &&
            typeof object['resolveLocalPluginPath'] === 'function'
        ) {
            return object['resolveLocalPluginPath'](context, scheme);
        }
        // eslint-disable-next-line no-null/no-null
        return null;
    }
}

async function resolveLocalPluginPath(context: PluginDeployerResolverContext, scheme: string): Promise<string | null> {
    const origin = context.getOriginId();
    const uri = new URI(origin);
    if (uri.scheme === scheme) {
        let fsPath = origin.substring(`${scheme}:`.length);
        if (!isAbsolute(fsPath)) {
            fsPath = resolve(process.cwd(), fsPath);
        }
        try {
            await fs.access(fsPath, constants.R_OK);
            return fsPath;
        } catch {
            console.warn(`The local plugin referenced by ${context.getOriginId()} does not exist.`);
        }
    }
    // eslint-disable-next-line no-null/no-null
    return null;
}

@injectable()
export class PluginDeployer_GH_12064 extends PluginDeployerImpl {

    @inject(MyLocalDirectoryPluginDeployerResolver)
    private readonly pluginResolver: MyLocalDirectoryPluginDeployerResolver;

    @postConstruct()
    protected adjustPluginResolvers(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginResolvers = <PluginDeployerResolver[]>(this as any).pluginResolvers;
        const index = pluginResolvers.findIndex(pluginResolver => pluginResolver instanceof LocalDirectoryPluginDeployerResolver);
        if (index >= 0) {
            pluginResolvers.splice(index, 1, this.pluginResolver);
        }
    }

}

export function bindPluginDeployerContribution(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(MyLocalDirectoryPluginDeployerResolver).toSelf().inSingletonScope();
    bind(PluginDeployer_GH_12064).toSelf().inSingletonScope();
    rebind(PluginDeployer).toService(PluginDeployer_GH_12064);
};
