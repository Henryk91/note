
import NoteDetail from '../src/client/views/Components/NoteDetail/NoteDetail';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { noteTestData } from "../NoteTestData"

test('NoteDetail component renders all details', () => {
    const cData = noteTestData();
    const rendered = renderer.create(
        <Router>
            <NoteDetail notes={cData} />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});