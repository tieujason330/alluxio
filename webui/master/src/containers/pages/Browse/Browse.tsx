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

import {faFile, faFolder} from '@fortawesome/free-regular-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {History, LocationState} from 'history';
import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {Button, Form, FormGroup, Input, Label, Table} from 'reactstrap';
import {compose, Dispatch} from 'redux';

import {
  FileView, hasErrors, hasFetchDataWithPath, hasFluidContainer, hasLoader,
  hasTextAreaResize, IFetchDataPathType,
  ITextAreaResizeState,
  Paginator
} from '@alluxio/common-ui/src/components';
import {IAlertErrors, IFileBlockInfo, IFileInfo, IRequest} from '@alluxio/common-ui/src/constants';
import {
  createAlertErrors,
  disableFormSubmit,
  renderFileNameLink
} from '@alluxio/common-ui/src/utilities';
import {IApplicationState} from '../../../store';
import {fetchRequest} from '../../../store/browse/actions';
import {IBrowse, IBrowseStateToProps} from '../../../store/browse/types';
import {IInit} from '../../../store/init/types';

import './Browse.css';

interface IPropsFromState {
  browseData: IBrowse;
  initData: IInit;
  class: string;
}

interface IBrowseProps {
  history: History<LocationState>;
}

export type AllProps = IPropsFromState & IBrowseProps & ITextAreaResizeState & IFetchDataPathType;

class Browse extends React.Component<AllProps> {
  public render() {
    const {browseData, initData, queryStringSuffix} = this.props;

    return !browseData.currentDirectory.isDirectory
      ? this.renderFileView(browseData, queryStringSuffix, initData)
      : this.renderDirectoryListing(initData, browseData, queryStringSuffix);
  }

  private renderFileView(browseData: IBrowse, queryStringSuffix: string, initData: IInit) {
    const {path, offset, end, history, textAreaHeight, createInputChangeHandler, createButtonHandler} = this.props;
    const offsetInputHandler = createInputChangeHandler('offset', value => value); //.bind(this);
    const beginInputHandler = createButtonHandler('end', value => undefined);//.bind(this);
    const endInputHandler = createButtonHandler('end', value => '1');//.bind(this);
    return (
      <div className="col-12">
        <FileView allowDownload={true} beginInputHandler={beginInputHandler} end={end} endInputHandler={endInputHandler}
                  offset={offset} offsetInputHandler={offsetInputHandler} path={path}
                  queryStringPrefix="/browse" queryStringSuffix={queryStringSuffix} textAreaHeight={textAreaHeight}
                  viewData={browseData} history={history} proxyDownloadApiUrl={initData.proxyDownloadFileApiUrl}/>
        <hr/>
        <h6>Detailed blocks information (block capacity is {browseData.blockSizeBytes} Bytes):</h6>
        <Table hover={true}>
          <thead>
          <tr>
            <th>ID</th>
            <th>Size (Byte)</th>
            <th>In {browseData.highestTierAlias}</th>
            <th>Locations</th>
          </tr>
          </thead>
          <tbody>
          {browseData.fileBlocks.map((fileBlock: IFileBlockInfo) => (
            <tr key={fileBlock.id}>
              <td>{fileBlock.id}</td>
              <td>{fileBlock.blockLength}</td>
              <td>
                {fileBlock.isInHighestTier ? 'YES' : 'NO'}
              </td>
              <td>
                {fileBlock.locations.map((location: string) => (
                  <div key={location}>{location}</div>
                ))}
              </td>
            </tr>
          ))}
          </tbody>
        </Table>
      </div>
    );
  }

  private renderDirectoryListing(initData: IInit, browseData: IBrowse, queryStringSuffix: string) {
    const {path, offset, limit} = this.props;
    const {history, createInputChangeHandler} = this.props;
    const fileInfos = browseData.fileInfos;
    const pathInputHandler = createInputChangeHandler('path', value => value);//.bind(this);
    return (
      <React.Fragment>
        <Form className="mb-3 browse-directory-form" id="browseDirectoryForm" inline={true}
              onSubmit={disableFormSubmit}>
          <FormGroup className="mb-2 mr-sm-2">
            <Button tag={Link} to={`/browse?path=/${queryStringSuffix}`} color="secondary"
                    outline={true}>Root</Button>
          </FormGroup>
          <FormGroup className="mb-2 mr-sm-2">
            <Label for="browsePath" className="mr-sm-2">Path</Label>
            <Input type="text" id="browsePath" placeholder="Enter a Path" value={path || '/'}
                   onChange={pathInputHandler}
                   onKeyUp={this.createInputEnterHandler(history, () =>
                   `/browse?path=${path}${queryStringSuffix}`)}/>
          </FormGroup>
          <FormGroup className="mb-2 mr-sm-2">
            <Button tag={Link} to={`/browse?path=${encodeURIComponent(path || '/')}${queryStringSuffix}`}
            color="secondary">Go</Button>
          </FormGroup>
        </Form>
        <Table hover={true}>
          <thead>
          <tr>
            <th/>
            {/* Icon placeholder */}
            <th>File Name</th>
            <th>Size</th>
            <th>Block Size</th>
            <th>In-Alluxio</th>
            {browseData.showPermissions && (
              <React.Fragment>
                <th>Mode</th>
                <th>Owner</th>
                <th>Group</th>
              </React.Fragment>
            )}
            <th>Persistence State</th>
            <th>Pin</th>
            <th>Creation Time</th>
            <th>Modification Time</th>
            {initData.debug && (
              <React.Fragment>
                <th>[D]DepID</th>
                <th>[D]INumber</th>
                <th>[D]UnderfsPath</th>
                <th>[D]File Locations</th>
              </React.Fragment>
            )}
          </tr>
          </thead>
          <tbody>
          {fileInfos && fileInfos.map((fileInfo: IFileInfo) => (
            <tr key={fileInfo.absolutePath}>
              <td><FontAwesomeIcon icon={fileInfo.isDirectory ? faFolder : faFile}/></td>
              <td>
                {renderFileNameLink(fileInfo.absolutePath, `/browse?path=`)}
              </td>
              <td>{fileInfo.size}</td>
              <td>{fileInfo.blockSizeBytes}</td>
              <td>{fileInfo.inAlluxioPercentage}%</td>
              {browseData.showPermissions && (
                <React.Fragment>
                  <td>
                    <pre className="mb-0"><code>{fileInfo.mode}</code></pre>
                  </td>
                  <td>{fileInfo.owner}</td>
                  <td>{fileInfo.group}</td>
                </React.Fragment>
              )}
              <td>{fileInfo.persistenceState}</td>
              <td>{fileInfo.pinned ? 'YES' : 'NO'}</td>
              <td>{fileInfo.creationTime}</td>
              <td>{fileInfo.modificationTime}</td>
              {initData.debug && (
                <React.Fragment>
                  <td>{fileInfo.id}</td>
                  <td>
                    {fileInfo.fileLocations.map((location: string) => <div key={location}>location</div>)}
                  </td>
                  <td>{fileInfo.absolutePath}</td>
                  <td>
                    {fileInfo.fileLocations.map((location: string) => (
                      <div key={location}>{location}</div>
                    ))}
                  </td>
                </React.Fragment>
              )}
            </tr>
          ))}
          </tbody>
        </Table>
        <Paginator baseUrl={'/browse'} path={path} total={browseData.ntotalFile} offset={offset} limit={limit}/>
      </React.Fragment>
    )
  }

  private createInputEnterHandler(history: History<LocationState>, stateValueCallback: (value: string) => string | undefined) {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
      const value = event.key;
      if (event.key === 'Enter') {
        const newPath = stateValueCallback(value);
        if (newPath) {
          if (history) {
            history.push(newPath);
          }
        }
      }
    };
  }
}

const mapStateToProps = ({browse, init, refresh}: IApplicationState): IBrowseStateToProps => {
  const errors: IAlertErrors = createAlertErrors(
      init.errors !== undefined || browse.errors !== undefined,
      [
        browse.data.accessControlException,
        browse.data.fatalError,
        browse.data.fileDoesNotExistException,
        browse.data.invalidPathError,
        browse.data.invalidPathException
      ]
  );

  return {
    browseData: browse.data,
    initData: init.data,
    refresh: refresh.data,
    loading: browse.loading || init.loading,
    class: 'browse-page',
    errors: errors
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchRequest: (request: IRequest) => dispatch(fetchRequest(request))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  hasFetchDataWithPath,
  hasErrors,
  hasLoader,
  hasTextAreaResize,
  hasFluidContainer,
)(Browse) as React.Component;
