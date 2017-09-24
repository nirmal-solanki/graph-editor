import {Component} from '@angular/core';
import * as d3 from 'd3';

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
        const range = 5;
        this.data = {
            nodes: d3.range(0, range).map((d) => {
                return {id: d, label: 'Node' + d, r: 20};
            }),
            links: d3.range(0, range).map(() => {
                const source = ~~d3.randomUniform(range)();
                const target = ~~d3.randomUniform(range)();
                return {source: source, target: target, left: source < target, right: source > target};
            })
        };
    }
}
