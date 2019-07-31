/*
 * The Alluxio Open Foundation licenses this work under the Apache License, version 2.0
 * (the "License"). You may not use this work except in compliance with the License, which is
 * available at www.apache.org/licenses/LICENSE-2.0
 *
 * This software is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied, as more fully set forth in the License.
 *
 * See the NOTICE file distributed with this work for information regarding copyright ownership.
 */

import {AxiosResponse} from 'axios';
import {ConnectedRouter} from 'connected-react-router';
import {History, LocationState} from 'history';
import React from 'react';
import {connect} from 'react-redux';
import {StaticContext} from 'react-router';
import {Redirect, Route, RouteComponentProps, Switch} from 'react-router-dom';
import {Alert} from 'reactstrap';
import {compose, Dispatch} from 'redux';

import {Footer, hasErrors, hasLoader, Header, LoadingMessage} from '@alluxio/common-ui/src/components';
import {triggerRefresh} from '@alluxio/common-ui/src/store/refresh/actions';
import {
  Browse, Configuration, Data, MasterLogs, Metrics, Overview, Workers
} from '..';
import {footerNavigationData, headerNavigationData} from '../../constants';
import {IApplicationState} from '../../store';
import {fetchRequest} from '../../store/init/actions';
import {IAppStateToProps, IInit} from '../../store/init/types';

import './App.css';
import {AutoRefresh, createAlertErrors, IAutoRefresh} from "@alluxio/common-ui/src/utilities";
import {hasFetchData} from "@alluxio/common-ui/src/components/HOCs/hasFetchData";
import {IStateToProps} from "@alluxio/common-ui/src/constants";

interface IPropsFromState {
  init: IInit;
}

interface IPropsFromDispatch {
  triggerRefresh: typeof triggerRefresh;
}

export interface IAppProps {
  history: History<LocationState>;
}

export type AllProps = IPropsFromState & IPropsFromDispatch & IAppProps;

export class App extends React.Component<AllProps> {
  private autoRefresh: IAutoRefresh;

  constructor(props: AllProps) {
    super(props);

    this.autoRefresh = new AutoRefresh(props.triggerRefresh, props.init.refreshInterval);
  }

  public render() {
    const {history} = this.props;

    return (
      <ConnectedRouter history={history}>
        <div className="App h-100">
          <div className="w-100 sticky-top header-wrapper">
            <Header history={history} data={headerNavigationData} autoRefreshCallback={this.autoRefresh.setAutoRefresh}/>
          </div>
          <div className="w-100 pt-5 mt-3 pb-4 mb-2">
            <Switch>
              <Route exact={true} path="/" render={this.redirectToOverview}/>
              <Route path="/overview" exact={true} render={this.renderView(Overview, undefined)}/>
              <Route path="/browse" exact={true} render={this.renderView(Browse, {history})}/>
              <Route path="/config" exact={true} render={this.renderView(Configuration, undefined)}/>
              <Route path="/data" exact={true} render={this.renderView(Data, undefined)}/>
              <Route path="/logs" exact={true} render={this.renderView(MasterLogs, {history})}/>
              <Route path="/metrics" exact={true} render={this.renderView(Metrics, undefined)}/>
              <Route path="/workers" exact={true} render={this.renderView(Workers, undefined)}/>
              <Route render={this.redirectToOverview}/>
            </Switch>
          </div>
          <div className="w-100 footer-wrapper">
            <Footer data={footerNavigationData}/>
          </div>
        </div>
      </ConnectedRouter>
    );
  }

  private renderView(Container: any, props: any) {
    return (routerProps: RouteComponentProps<any, StaticContext, any>) => {
      return (
        <Container {...routerProps} {...props}/>
      );
    }
  }

  private redirectToOverview(routerProps: RouteComponentProps<any, StaticContext, any>) {
    return (
      <Redirect to="/overview"/>
    );
  }
}

const mapStateToProps = ({init, refresh}: IApplicationState): IAppStateToProps => ({
  init: init.data,
  errors: createAlertErrors(init.errors !== undefined),
  loading: !init.data && init.loading,
  refresh: refresh.data,
  class: 'App'
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchRequest: () => dispatch(fetchRequest()),
  triggerRefresh: () => dispatch(triggerRefresh())
});

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    hasFetchData,
    hasErrors,
    hasLoader
)(App);
