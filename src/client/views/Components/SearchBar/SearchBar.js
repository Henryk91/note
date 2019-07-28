import React, { Component } from 'react'

export default class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            search: false,
        };
        this.search = this.search.bind(this)
    }
    componentDidMount(){

       
    }
    search = () => {

        let note = this.props.notes
        if (note) {
            let searchTerm = this.title.value
            note = note.filter((val) => {
                let firtName = val.heading.toLowerCase()
                let term = searchTerm.toLowerCase()
                return firtName.includes(term)
            })
        }
        // localStorage.setItem("user", this.title2.value);
        this.props.set({ filteredNotes: note, user: this.title2.value })
    }

    render() {
        var user = this.props.noteName
        
        if (user && this.title2){
         this.title2.value = user 
          // localStorage.setItem("user", user);
        }
        return (
            <header>
                <input
                    id="userNameBox"
                    type="text" ref={(c) => this.title2 = c}
                    aria-label="User Name"
                    onKeyUp={this.search}
                    defaultValue={user}
                    placeholder="Add Note Name" >
                </input><br />
                <input
                    id="searchBox"
                    aria-label="Search Name"
                    onKeyUp={this.search}
                    type="text" ref={(c) => this.title = c}
                    placeholder="Search By Name..." >
                </input>
                {this.state.search ? <div id="addItem" className="loader"></div> : null}
            </header>
        )
    }
}

