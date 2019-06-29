import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            notes: null,
            list: null
        }
    }
    render() {
        let list = this.props.notes
        return (
            <div id="home">
                {list ?
                    <div><br />{createList(list)}</div> :
                    <h3>Please add your name at the top then <br /> click My Notes or All Notes.</h3>
                }
            </div>
        );
    }
}
const createList = (notes) => {
    let list = null
    if (notes) {
        list = notes.map((person) => {
            return (
                <div className="listNameButton" key={person.id}>
                    <Link style={{ textDecoration: 'none' }} to={`/notes/${person.id}`}>
                        <h3>{person.heading}</h3>
                    </Link>
                </div>)
        })
    }
    return list
}
