import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

// Since we are using HtmlWebpackPlugin WITHOUT a template, we should create our own root node in the body element before rendering into it
let root = document.createElement('div');
root.id = "root";
document.body.appendChild( root );

window.onerror = (message, filename, lineno) =>
{
    console.warn(`ERROR in ${filename} (${lineno}): ${message}`);
}

// Now we can render our application into it
render( <App />, document.getElementById('root') );
