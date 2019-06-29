
import NewNote from '../src/client/views/Components/NewNote/NewNote';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

test('NoteDetail component renders all details', () => {

    const rendered = renderer.create(
        <Router>
            <NewNote />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});