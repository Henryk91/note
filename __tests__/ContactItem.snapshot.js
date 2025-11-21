
import NoteItem from '../frontend/src/client/views/Components/NoteItem/NoteItem';
import renderer from 'react-test-renderer';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';


test('NoteItem component renders all details', () => {

    const rendered = renderer.create(
        <Router>
            <NoteItem item={"0808080"} type={"Number"} index={0} />
        </Router>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});
