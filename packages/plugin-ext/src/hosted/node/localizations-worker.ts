// *****************************************************************************
// Copyright (C) 2023 Arduino SA and others.
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

import { Localization } from '@theia/core/lib/common/i18n/localization';
import { isObject, Mutable } from '@theia/core/lib/common/types';
import { URI } from '@theia/core/lib/common/uri';
import * as fs from '@theia/core/shared/fs-extra';
import { Deferred } from '@theia/core/src/common/promise-util';
import * as path from 'path';
import type { WorkerCallback } from 'worker-farm';
import { isENOENT } from '../../common/errors';
import type { LanguagePackBundle } from '../../common/language-pack-service';
import { PluginIdentifiers } from '../../common/plugin-identifiers';
import type { DeployedPlugin, Localization as PluginLocalization, Translation } from '../../common/plugin-protocol';

export interface DeployLocalizationsParams {
    readonly plugin: Readonly<DeployedPlugin>;
}
export interface DeployLocalizationsResult {
    readonly versionedId: PluginIdentifiers.VersionedId
    readonly localizations?: readonly Localization[];
    readonly languagePackBundleParams?: readonly LanguagePackBundleParams[]
}
export interface StoreLanguagePackBundleParams {
    readonly pluginId: string;
    readonly locale: string;
    readonly bundle: Readonly<LanguagePackBundle>;
}
export interface DeleteLanguagePackBundleParams {
    readonly pluginId: string,
    readonly locale?: string;
}
export interface LanguagePackBundleParams {
    readonly storeParams: StoreLanguagePackBundleParams
    readonly deleteParams: DeleteLanguagePackBundleParams
}

export function deployLocalizations(params: DeployLocalizationsParams, callback: WorkerCallback): void {
    const ready = new Deferred<void>();
    const { plugin } = params;
    const { model } = plugin.metadata;
    const versionedId = PluginIdentifiers.componentsToVersionedId(model);
    const localizations = plugin?.contributes?.localizations;
    const l10n = model.l10n
    const result: Mutable<DeployLocalizationsResult> = { versionedId };
    if (localizations) {
        result.localizations = buildLocalizations(localizations);
    }
    if (l10n || localizations) {
        updateLanguagePackBundles(plugin).then(languagePackBundleParams => {
            result.languagePackBundleParams = languagePackBundleParams;
            ready.resolve();
        })
    } else {
        ready.resolve()
    }
    ready.promise.then(() => callback(null, result, null, null));
}

export interface LocalizePluginParams {
    readonly plugin: Readonly<DeployedPlugin>;
}
export interface LocalizePluginResult {
    readonly plugin: unknown;
}

export async function localizePlugin(params: LocalizePluginParams): Promise<void> { }

interface PackageTranslation {
    translation?: Record<string, string>
    default?: Record<string, string>
}
const NLS_REGEX = /^%([\w\d.-]+)%$/i;
function localizePackage(value: unknown, translations: PackageTranslation, callback: (key: string, defaultValue: string) => string): unknown {
    if (typeof value === 'string') {
        const match = NLS_REGEX.exec(value);
        let result = value;
        if (match) {
            const key = match[1];
            if (translations.translation) {
                result = translations.translation[key];
            } else if (translations.default) {
                result = callback(key, translations.default[key]);
            }
        }
        return result;
    }
    if (Array.isArray(value)) {
        const result = [];
        for (const item of value) {
            result.push(localizePackage(item, translations, callback));
        }
        return result;
    }
    if (isObject(value)) {
        const result: Record<string, unknown> = {};
        for (const [name, item] of Object.entries(value)) {
            result[name] = localizePackage(item, translations, callback);
        }
        return result;
    }
    return value;
}

async function updateLanguagePackBundles(plugin: DeployedPlugin): Promise<LanguagePackBundleParams[]> {
    const result: LanguagePackBundleParams[] = [];
    const pluginId = plugin.metadata.model.id;
    const packageUri = new URI(plugin.metadata.model.packageUri);
    if (plugin.contributes?.localizations) {
        for (const localization of plugin.contributes.localizations) {
            for (const translation of localization.translations) {
                const l10n = getL10nTranslation(translation);
                if (l10n) {
                    const translatedPluginId = translation.id;
                    const translationUri = packageUri.resolve(translation.path);
                    const locale = localization.languageId;
                    // We store a bundle for another extension in here
                    // Hence we use `translatedPluginId` instead of `pluginId`
                    result.push({
                        storeParams: {
                            pluginId: translatedPluginId,
                            locale,
                            bundle: {
                                contents: processL10nBundle(l10n),
                                uri: translationUri.toString()
                            }
                        },
                        deleteParams: {
                            pluginId: translatedPluginId,
                            locale // Only dispose the deleted locale for the specific plugin
                        }
                    })
                }
            }
        }
    }
    // The `l10n` field of the plugin model points to a relative directory path within the plugin
    // It is supposed to contain localization bundles that contain translations of the plugin strings into different languages
    if (plugin.metadata.model.l10n) {
        const bundleDirectory = packageUri.resolve(plugin.metadata.model.l10n);
        const bundles = await loadPluginBundles(bundleDirectory);
        if (bundles) {
            for (const [locale, bundle] of Object.entries(bundles)) {
                result.push({
                    storeParams: {
                        pluginId,
                        locale,
                        bundle
                    },
                    deleteParams: {
                        pluginId
                        // No `locale`. Dispose all bundles contributed by the deleted plugin
                    }
                })
            }
        }
    }
    return result;
}

function getL10nTranslation(translation: Translation): UnprocessedL10nBundle | undefined {
    // 'bundle' is a special key that contains all translations for the l10n vscode API
    // If that doesn't exist, we can assume that the language pack is using the old vscode-nls API
    return translation.contents.bundle;
}

async function loadPluginBundles(l10nUri: URI): Promise<Record<string, LanguagePackBundle> | undefined> {
    try {
        const directory = l10nUri.path.fsPath();
        const files = await fs.readdir(directory);
        const result: Record<string, LanguagePackBundle> = {};
        await Promise.all(files.map(async fileName => {
            const match = fileName.match(/^bundle\.l10n\.([\w\-]+)\.json$/);
            if (match) {
                const locale = match[1];
                const contents = await fs.readJSON(path.join(directory, fileName));
                result[locale] = {
                    contents,
                    uri: l10nUri.resolve(fileName).toString()
                };
            }
        }));
        return result;
    } catch (err) {
        // The directory either doesn't exist or its contents cannot be parsed
        console.error(`Failed to load plugin localization bundles from ${l10nUri}.`, err);
        // In any way we should just safely return undefined
        return undefined;
    }
}

type UnprocessedL10nBundle = Record<string, string | { message: string }>;

function processL10nBundle(bundle: UnprocessedL10nBundle): Record<string, string> {
    const processedBundle: Record<string, string> = {};
    for (const [name, value] of Object.entries(bundle)) {
        const stringValue = typeof value === 'string' ? value : value.message;
        processedBundle[name] = stringValue;
    }
    return processedBundle;
}


async function loadPackageTranslations(pluginPath: string, locale: string): Promise<PackageTranslation> {
    const localizedPluginPath = path.join(pluginPath, `package.nls.${locale}.json`);
    try {
        const defaultValue = coerceLocalizations(await fs.readJson(path.join(pluginPath, 'package.nls.json')));
        if (await fs.pathExists(localizedPluginPath)) {
            return {
                translation: coerceLocalizations(await fs.readJson(localizedPluginPath)),
                default: defaultValue
            };
        }
        return {
            default: defaultValue
        };
    } catch (e) {
        if (!isENOENT(e)) {
            throw e;
        }
        return {};
    }
}

interface LocalizeInfo {
    message: string
    comment?: string
}

function isLocalizeInfo(obj: unknown): obj is LocalizeInfo {
    return isObject(obj) && 'message' in obj || false;
}

function coerceLocalizations(translations: Record<string, string | LocalizeInfo>): Record<string, string> {
    for (const [key, value] of Object.entries(translations)) {
        if (isLocalizeInfo(value)) {
            translations[key] = value.message;
        } else if (typeof value !== 'string') {
            // Only strings or LocalizeInfo values are valid
            translations[key] = 'INVALID TRANSLATION VALUE';
        }
    }
    return translations as Record<string, string>;
}

// Old plugin localization logic for vscode-nls
// vscode-nls was used until version 1.73 of VSCode to translate extensions

function buildLocalizations(localizations: PluginLocalization[]): Localization[] {
    const theiaLocalizations: Localization[] = [];
    for (const localization of localizations) {
        const theiaLocalization: Localization = {
            languageId: localization.languageId,
            languageName: localization.languageName,
            localizedLanguageName: localization.localizedLanguageName,
            languagePack: true,
            translations: {}
        };
        for (const translation of localization.translations) {
            for (const [scope, value] of Object.entries(translation.contents)) {
                for (const [key, item] of Object.entries(value)) {
                    const translationKey = buildTranslationKey(translation.id, scope, key);
                    theiaLocalization.translations[translationKey] = item;
                }
            }
        }
        theiaLocalizations.push(theiaLocalization);
    }
    return theiaLocalizations;
}

function buildTranslationKey(pluginId: string, scope: string, key: string): string {
    return `${pluginId}/${Localization.transformKey(scope)}/${key}`;
}
