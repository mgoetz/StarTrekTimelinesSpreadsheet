import * as React from "react";
import * as ReactDOM from "react-dom";
import STTApi from './STTApi';

import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { DetailsList, DetailsListLayoutMode, Selection, IColumn } from 'office-ui-fabric-react/lib/DetailsList';

import { LoginDialog } from "./loginDialog";

export interface IAppState {
    dataLoaded: boolean;
    showSpinner: boolean;
    loggedIn: boolean;
    columns: IColumn[];
}

class App extends React.Component<any, IAppState> {
    constructor() {
        super();

        this._onAccessToken = this._onAccessToken.bind(this);

        const _columns: IColumn[] = [
            {
                key: 'id',
                name: 'ID',
                fieldName: 'id',
                minWidth: 10
            },
            {
                key: 'short_name',
                name: 'Name',
                fieldName: 'short_name',
                minWidth: 30
            },
            {
                key: 'name',
                name: 'Full Name',
                fieldName: 'name',
                minWidth: 80
            }
        ];

        this.state = {
            showSpinner: false,
            dataLoaded: false,
            loggedIn: false,
            columns: _columns
        };
    }

    render() {
        if (!this.state.loggedIn) {
            return <LoginDialog onAccessToken={this._onAccessToken} />;
        }
        return (<div>
            {this.state.showSpinner && (
                <Spinner size={SpinnerSize.large} label='Loading data...' />
            )}

            {this.state.dataLoaded && (
                <DetailsList
                    items={STTApi.crewAvatars}
                    columns={this.state.columns}
                    setKey='set'
                    layoutMode={DetailsListLayoutMode.justified}
                    isHeaderVisible={true}
                />
            )}
        </div>);
    }

    _onAccessToken(autoLogin: boolean) {
        this.setState({ loggedIn: true, showSpinner: true });

        STTApi.loadCrewArchetypes().then(() => {
            this.setState({
                showSpinner: false,
                dataLoaded: true
            });
        });
    }
}

ReactDOM.render(<App />, document.getElementById("content"));