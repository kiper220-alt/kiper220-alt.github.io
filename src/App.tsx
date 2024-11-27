import React from 'react';
import logo from './logo.svg';
import {PackagesTable} from './packages';

async function App() {
    let table = new PackagesTable(["sisyphus", "p11", "p10"], ["gpupdate", "gpui", "alterator-module-executor"]);

    let before = table.render();
    await table.fetch();
    let after = table.render();

    return (
        <div className="App">
            <h1>Before <code>fetch()</code></h1>
            { before }
            <h1>After <code>fetch()</code></h1>
            { after }
        </div>
    );
}

export default App;
