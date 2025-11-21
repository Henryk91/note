
import App from '../frontend/src/client/App'
import renderer from 'react-test-renderer';
import React from 'react';


test('App component renders all details', () => {

    const rendered = renderer.create(
        <App />
    );
    expect(rendered.toJSON()).toMatchSnapshot();
});
