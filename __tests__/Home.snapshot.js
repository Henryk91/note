
import Home from '../src/client/views/Components/Home/Home';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { noteTestData } from "../NoteTestData"

test('NoteDetail component renders all details', () => {
    const cData = noteTestData();
    const rendered = renderer.create(
        <Router>
            <Home notes={cData} />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});