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

import {configure, mount, ReactWrapper, shallow, ShallowWrapper} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {createBrowserHistory, History, LocationState} from 'history';
import React from 'react';
import {StaticRouter} from "react-router";
import sinon, {SinonSpy} from 'sinon';

import Logs, {AllProps, LogsPresenter} from './Logs';
import {initialState} from "../../../../master/src/store";


configure({adapter: new Adapter()});

describe('Logs', () => {
  let history: History<LocationState>;
  let props: AllProps;

  beforeAll(() => {
    history = createBrowserHistory({keyLength: 0});
    history.push('/logs');
    props = {
      location: {search: ''},
      history: history,
      fetchRequest: sinon.spy(() => {}),
      data: initialState.logs.data,
      refresh: initialState.refresh.data,
      textAreaHeight: 0,
      path: '',
      offset: '',
      end: '',
      queryStringSuffix: '',
      limit: '',
      createButtonHandler: sinon.spy(),
      createInputChangeHandler: sinon.spy(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Shallow component', () => {
    let shallowWrapper: ShallowWrapper;

    beforeAll(() => {
      shallowWrapper = shallow(<LogsPresenter {...props}/>);
    });

    it('Renders without crashing', () => {
      expect(shallowWrapper.length).toEqual(1);
    });

    it('Matches snapshot with file', () => {
      expect(shallowWrapper).toMatchSnapshot();
    });

    it('Matches snapshot with table', () => {
      const data = {...initialState.logs.data};
      data.fileData = null;
      shallowWrapper.setProps({data: data});
      expect(shallowWrapper).toMatchSnapshot();
    });
  });

  // describe('App with connected component', () => {
  //   let reactWrapper: ReactWrapper;
  //   let context = {};
  //
  //   beforeAll(() => {
  //     reactWrapper = mount(
  //         <StaticRouter location="someLocation" context={context}>
  //           <LogsPresenter {...props}/>
  //         </StaticRouter>
  //     );
  //   });
  //
  //   it('Renders without crashing', () => {
  //     expect(reactWrapper.length).toEqual(1);
  //   });
  //
  //   // it('Contains the component', () => {
  //   //   expect(reactWrapper.find('.logs-page').length).toEqual(1);
  //   // });
  //
  //   // it('Calls fetchRequest', () => {
  //   //   sinon.assert.called(props.fetchRequest as SinonSpy);
  //   // });
  //
  //   it('Matches snapshot', () => {
  //     expect(reactWrapper).toMatchSnapshot();
  //   });
  // });
});
