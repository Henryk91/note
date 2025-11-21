
import NewNote from '../frontend/src/client/views/Components/NewNote/NewNote';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

test('NoteDetail component renders all details', () => {

    const rendered = renderer.create(
        <Router>
            <NewNote Theme={this.props.Theme} />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});
