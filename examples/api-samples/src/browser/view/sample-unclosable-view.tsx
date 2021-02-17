/********************************************************************************
 * Copyright (C) 2020 TORO Limited and others.
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

import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from 'inversify';
import { CommandService } from '@theia/core/lib/common/command';
import * as React from 'react';

/**
 * This sample view is used to demo the behavior of "Widget.title.closable".
 */
@injectable()
export class SampleViewUnclosableView extends ReactWidget {
  static readonly ID = 'sampleUnclosableView';

  @inject(CommandService)
  protected readonly commandService: CommandService;

  @postConstruct()
  init(): void {
    this.id = SampleViewUnclosableView.ID;
    this.title.caption = 'Sample Unclosable View';
    this.title.label = 'Sample Unclosable View';
    this.title.iconClass = 'fa fa-window-maximize';
    this.title.closable = false;
    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <div>
        Closable
        <input type="checkbox" defaultChecked={this.title.closable} onChange={e => this.title.closable = e.target.checked} />
        <TheiaSwizardExtensionView commandService={this.commandService} />
      </div>
    );
  }
}

interface Sensor {
  brand: string;
  model: string;
  name: string;
}

export class SensorView extends React.Component<Sensor> {
  render(): JSX.Element {
    return <React.Fragment>
      <ul>
        <li>Brand: {this.props.brand}</li>
        <li>Model: {this.props.model}</li>
        <li>Name: {this.props.name}</li>
      </ul>
    </React.Fragment>;
  }
}

export class TheiaSwizardExtensionView extends React.Component<{ commandService: CommandService }, Sensor> {

  constructor(props: { commandService: CommandService }) {
    super(props);

    this.state = {
      brand: '',
      model: '',
      name: ''
    };
  }

  render(): JSX.Element {
    return <div id="widget-container">

      <h2>New Sensor</h2>

      <SensorView brand={this.state.brand} model={this.state.model} name={this.state.name} />

      <form onSubmit={this.handleSubmit}>
        <label>Brand: <input value={this.state.brand} onChange={this.updateBrand} /></label>
        <label>Model: <input value={this.state.model} onChange={this.updateModel} /></label>
        <input type="submit" value="OK" />
      </form>
    </div>;
  }

  protected handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.getName();
    console.log(typeof this.props.commandService, `Here you can invoke the command service with the state ${JSON.stringify(this.state)}`);
  };

  protected updateBrand = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
    brand: e.currentTarget.value
  });

  protected updateModel = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
    model: e.currentTarget.value
  });

  protected getName = () => this.setState({
    name: `${this.cleanString(this.state.brand)}_${this.cleanString(this.state.model)}`
  });

  protected cleanString = (s: string) => s.toUpperCase().replace(/ /g, '_');
}
