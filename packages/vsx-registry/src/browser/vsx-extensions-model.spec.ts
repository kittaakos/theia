// *****************************************************************************
// Copyright (C) 2025 and others.
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
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();
FrontendApplicationConfigProvider.set({});

import { PreferenceInspection, PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { Emitter } from '@theia/core/lib/common/event';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { Container } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import type { FileStat } from '@theia/filesystem/lib/common/files';
import { OVSXApiFilterProvider } from '@theia/ovsx-client/lib/ovsx-api-filter';
import type { VSXSearchOptions, VSXSearchResult } from '@theia/ovsx-client/lib/ovsx-types';
import type { PluginMetadata } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { RequestService } from '@theia/request/lib/common-request-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { OVSXClientProvider } from '../common';
import { VSXExtensionFactory } from './vsx-extension';
import { VSXExtensionsModel } from './vsx-extensions-model';
import { VSXExtensionsSearchModel } from './vsx-extensions-search-model';

disableJSDOM();

interface Overrides {
    clientProvider?: OVSXClientProvider;
    pluginSupport?: HostedPluginSupport;
    extensionFactory?: VSXExtensionFactory;
    progressService?: ProgressService;
    preferences: PreferenceService;
    workspaceService?: WorkspaceService;
    search?: VSXExtensionsSearchModel;
    request?: RequestService
    vsxApiFilter?: OVSXApiFilterProvider
    fileService?: FileService;
    applicationServer?: ApplicationServer;
}

const defaultOverrides: Required<Overrides> = {
    clientProvider: {} as OVSXClientProvider,
    pluginSupport: {} as HostedPluginSupport,
    extensionFactory: {} as VSXExtensionFactory,
    progressService: {} as ProgressService,
    preferences: {} as PreferenceService,
    workspaceService: {} as WorkspaceService,
    search: {} as VSXExtensionsSearchModel,
    request: {} as RequestService,
    vsxApiFilter: {} as OVSXApiFilterProvider,
    fileService: {} as FileService,
    applicationServer: {} as ApplicationServer,
} as const;

function setup(overrides: Partial<Overrides> = {}): { container: Container; model: VSXExtensionsModel } {
    const container = createContainer(overrides);
    const model = createVSXExtensionsModel(container);
    return { container, model };
}

function createContainer(overrides: Partial<Overrides> = {}): Container {
    const { clientProvider,
        pluginSupport,
        extensionFactory,
        progressService,
        preferences,
        workspaceService,
        search,
        request,
        vsxApiFilter,
        fileService,
        applicationServer
    } = {
        ...defaultOverrides,
        ...overrides
    };

    const container = new Container();
    container.bind(VSXExtensionsModel).toSelf().inSingletonScope();

    container.bind(VSXExtensionsSearchModel).toConstantValue(search);
    container.bind(OVSXClientProvider).toConstantValue(clientProvider);
    container.bind(OVSXApiFilterProvider).toConstantValue(vsxApiFilter);
    container.bind(VSXExtensionFactory).toConstantValue(extensionFactory);
    container.bind(ProgressService).toConstantValue(progressService);
    container.bind(WorkspaceService).toConstantValue(workspaceService);
    container.bind(PreferenceService).toConstantValue(preferences);
    container.bind(FileService).toConstantValue(fileService);
    container.bind(RequestService).toConstantValue(request);
    container.bind(ApplicationServer).toConstantValue(applicationServer);
    container.bind(HostedPluginSupport).toConstantValue(pluginSupport);
    container.bind(OVSXClientProvider).toConstantValue(clientProvider);
    container.bind(OVSXApiFilterProvider).toConstantValue(vsxApiFilter);
    container.bind(ProgressService).toConstantValue(progressService);
    return container;
}

function createVSXExtensionsModel(container: Container | (() => Container)): VSXExtensionsModel {
    if (typeof container === 'function') {
        container = container();
    }
    const authService = container.get(VSXExtensionsModel);
    return authService;
}

describe('VSXExtensionsModel', () => {
    it('creates an instance of the VSX extensions model', () => {
        const progressService = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            withProgress: (_text: string, _locationId: string, task: () => Promise<any>, _onDidCancel?: () => void) => task()
        } as ProgressService;

        const onDidChangePluginsEmitter = new Emitter<void>();
        const plugins: PluginMetadata[] = [];
        const pluginSupport = {
            willStart: Promise.resolve(),
            onDidChangePlugins: onDidChangePluginsEmitter.event,
            plugins
        } as HostedPluginSupport;

        const onDidChangeQueryEmitter = new Emitter<string>();
        const search = {
            onDidChangeQuery: onDidChangeQueryEmitter.event,
        } as VSXExtensionsSearchModel;

        const extensions: VSXSearchResult[] = [];
        const clientProvider = (() => {
            search: (_options: VSXSearchOptions) => Promise.resolve({ offset: 0, extensions });
        }) as OVSXClientProvider;

        const vsxApiFilter = (() => { }) as OVSXApiFilterProvider;

        const onPreferenceChangedEmitter = new Emitter<unknown>();
        const preferences = {
            onPreferenceChanged: onPreferenceChangedEmitter.event,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inspect(_preferenceName, _resourceUri, _forceLanguageOverride): PreferenceInspection<any> | undefined {
                return undefined;
            },
            ready: Promise.resolve(),
        } as PreferenceService;

        const roots: FileStat[] = [];
        const workspaceService = {
            roots: Promise.resolve(roots),
            saved: false
        } as WorkspaceService;

        const { model } = setup({
            progressService,
            pluginSupport,
            search,
            clientProvider,
            vsxApiFilter,
            preferences,
            workspaceService,
        });

        expect(model).not.to.be.undefined;
    });
});
