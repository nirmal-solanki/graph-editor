import {Component} from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {

    public data: any;

    constructor() {
        this.fnCreateData();
    }

    fnCreateData() {
        if (localStorage.getItem('NGE_DB')) {
            this.data = JSON.parse(atob(localStorage.getItem('NGE_DB')));
        } else {
            this.data = {nodes: [], links: []};
        }
    }

    fnSaveGraph(data) {
        localStorage.setItem('NGE_DB', btoa(JSON.stringify(data)));
    }

    fnClearGraph() {
        localStorage.removeItem('NGE_DB');
    }
}
