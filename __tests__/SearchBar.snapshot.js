
import SearchBar from '../frontend/src/client/views/Components/SearchBar/SearchBar';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { noteTestData } from "../NoteTestData"

test('NoteDetail component renders all details', () => {
    const cData = noteTestData();
    const rendered = renderer.create(
        <Router>
            <SearchBar notes={cData} />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});
