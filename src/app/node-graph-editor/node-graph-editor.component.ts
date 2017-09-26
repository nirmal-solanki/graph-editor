import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-node-graph-editor',
    templateUrl: './node-graph-editor.component.html',
    styleUrls: ['./node-graph-editor.component.css']
})

export class NodeGraphEditorComponent implements OnInit, OnChanges {

    @ViewChild('nodeGraphEditor') private chartContainer: ElementRef;
    @Input() public data: any = {nodes: [], links: []};
    @Output() onSave: EventEmitter<any> = new EventEmitter();
    @Output() onClear: EventEmitter<any> = new EventEmitter();
    private margin: any = {top: 50, bottom: 50, left: 50, right: 50};
    private width: number;
    private height: number;
    private svg: any;
    private chart: any;
    private links: any;
    private nodes: any;
    private simulation: any;
    private drag: any;
    private dragLine: any;
    private mouseDownNode: any;
    private mouseUpNode: any;

    constructor() {
    }

    ngOnInit() {
        this.fnCreateChart();
        if (this.data) {
            this.fnUpdateChart();
        }
    }

    ngOnChanges() {
        if (this.chart) {
            this.fnUpdateChart();
        }
    }

    fnCreateChart() {
        const self = this;
        const element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id((d) => d.id))
            .force('collide', d3.forceCollide((d) => d.r + 8).iterations(16))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('y', d3.forceY(0))
            .force('x', d3.forceX(0));

        this.drag = d3.drag()
            .on('start', (d) => {
                self.fnDragStarted(self, d);
            })
            .on('drag', (d) => {
                this.fnDragged(self, d);
            })
            .on('end', (d) => {
                this.fnDragEnded(self, d);
            });

        this.svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight)
            .on('mousemove', () => {
                if (!self.mouseDownNode) {
                    return;
                }
                const mouse = d3.mouse(d3.event.currentTarget);
                self.dragLine.attr('d', 'M' + (self.mouseDownNode.x + 50) + ',' + (self.mouseDownNode.y + 50) +
                    'L' + mouse[0] + ',' + mouse[1]);
            })
            .on('mouseup', () => {
                self.mouseDownNode = null;
                self.dragLine
                    .style('marker-end', '')
                    .attr('d', 'M0,0L0,0');
            });

        // define arrow markers for graph links
        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');

        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 2)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#000');

        this.dragLine = this.svg.append('svg:path')
            .attr('class', 'link drag-line')
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', 2)
            .attr('d', 'M0,0L0,0');

        this.chart = this.svg.append('g')
            .attr('class', 'chart-area')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.links = this.chart.append('g').attr('class', 'links');
        this.nodes = this.chart.append('g').attr('class', 'nodes');
    }

    fnUpdateChart() {
        const self = this;
        this.data.nodes = this.data.nodes.map((d) => {
            d.fx = d.fx ? d.fx : d3.randomUniform(this.margin.left, this.width)();
            d.fy = d.fy ? d.fy : d3.randomUniform(this.margin.top, this.height)();
            return d;
        });

        const updateLinks = this.links.selectAll('.link').data(this.data.links);

        // remove exiting links
        updateLinks.exit().remove();

        // update existing links
        this.links.selectAll('.link')
            .style('marker-start', (d) => (d.left ? 'url(#start-arrow)' : ''))
            .style('marker-end', (d) => (d.right ? 'url(#end-arrow)' : ''))
            .attr('d', self.fnDrawLine);

        // add new links
        updateLinks
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', 2)
            .style('marker-start', (d) => (d.left ? 'url(#start-arrow)' : ''))
            .style('marker-end', (d) => (d.right ? 'url(#end-arrow)' : ''))
            .attr('d', self.fnDrawLine);

        const nodeGroup = this.nodes.selectAll('g.node').data(this.data.nodes);

        // enter selection
        const nodeGroupEnter = nodeGroup.enter().append('g').attr('class', 'node');
        nodeGroupEnter.append('circle')
            .attr('class', 'parent')
            .attr('r', (d) => d.r)
            .style('cursor', 'crosshair')
            .style('fill', 'blue')
            .on('mousedown', function (d) {
                if (d3.event.ctrlKey) {
                    return;
                }

                // select node
                self.mouseDownNode = d;

                const mouse = d3.mouse(d3.event.currentTarget);
                mouse[0] = mouse[0] + 50;
                mouse[1] = mouse[1] + 50;
                // reposition drag line
                self.dragLine
                    .style('marker-end', 'url(#end-arrow)')
                    .attr('d', 'M' + mouse[0] + ',' + mouse[1] + 'L' +
                        mouse[0] + ',' + mouse[1]);
            })
            .on('mouseup', function (d) {
                if (!self.mouseDownNode) {
                    return;
                }

                // needed by FF
                self.dragLine
                    .style('marker-end', '')
                    .attr('d', 'M0,0L0,0');

                // check for drag-to-self
                self.mouseUpNode = d;
                if (self.mouseUpNode === self.mouseDownNode) {
                    return;
                }

                // add link to graph (update if exists)
                // NB: links are strictly source < target; arrows separately specified by booleans
                let source, target, direction;
                if (self.mouseDownNode.id < self.mouseUpNode.id) {
                    source = self.mouseDownNode;
                    target = self.mouseUpNode;
                    direction = 'right';
                } else {
                    source = self.mouseUpNode;
                    target = self.mouseDownNode;
                    direction = 'left';
                }

                let link;
                link = self.data.links.filter(function (l) {
                    return (l.source === source && l.target === target);
                })[0];

                if (link) {
                    link[direction] = true;
                } else {
                    link = {source: source, target: target, left: false, right: false};
                    link[direction] = true;
                    self.data.links.push(link);
                }

                self.fnUpdateChart();
            });

        nodeGroupEnter.append('circle')
            .attr('class', 'child')
            .attr('r', (d) => d.r - 5)
            .style('fill', 'skyblue')
            .call(this.drag);

        // update selection -- this will also contain the newly appended elements
        nodeGroup.select('circle.parent')
            .attr('r', (d) => d.r)
            .style('cursor', 'crosshair')
            .style('fill', 'blue');
        nodeGroup.select('circle.child')
            .attr('r', (d) => d.r - 5).style('fill', 'skyblue')
            .call(this.drag);

        // exit selection
        nodeGroup.exit().remove();

        this.simulation.nodes(this.data.nodes).on('tick', () => {
            this.links.selectAll('.link').attr('d', self.fnDrawLine);

            this.nodes.selectAll('.node').select('.parent')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y);
            this.nodes.selectAll('.node').select('.child')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y);
        });
        this.simulation.force('link').links(this.data.links);
    }

    /**
     * Draw line between node
     * */
    fnDrawLine(d) {
        const deltaX = d.target.x - d.source.x;
        const deltaY = d.target.y - d.source.y;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const normX = deltaX / dist;
        const normY = deltaY / dist;
        const sourcePadding = 20;
        const targetPadding = 20;
        const sourceX = d.source.x + (sourcePadding * normX);
        const sourceY = d.source.y + (sourcePadding * normY);
        const targetX = d.target.x - (targetPadding * normX);
        const targetY = d.target.y - (targetPadding * normY);
        if (isNaN(sourceX)) {
            return '';
        }
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    }

    /**
     * Node drag start event
     * */
    fnDragStarted(self, d) {
        if (!d3.event.active) {
            self.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * Node dragged event
     * */
    fnDragged(self, d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    /**
     * Node drag end event
     * */
    fnDragEnded(self, d) {
        if (!d3.event.active) {
            self.simulation.alphaTarget(0);
        }
        // d.fx = null;
        // d.fy = null;
    }

    /**
     * Add new node in graph.
     * */
    fnAddNewNode() {
        const id = Date.now();
        this.data.nodes.push({id: id, label: 'NODE:' + id, r: 20});
        this.fnUpdateChart();
    }

    /**
     * Return graph nodes and links data with postion
     * */
    fnSave(data): void {
        const newData = {nodes: [], links: []};
        for (let nodeIndex = 0; nodeIndex < data.nodes.length; nodeIndex++) {
            const nObj = data.nodes[nodeIndex];
            newData.nodes.push({
                id: nObj.id,
                label: nObj.label,
                r: nObj.r,
                x: nObj.x,
                y: nObj.y,
                fx: nObj.fx,
                fy: nObj.fy
            });
        }
        for (let linkIndex = 0; linkIndex < data.links.length; linkIndex++) {
            const lObj = data.links[linkIndex];
            newData.links.push({
                source: lObj.source.id,
                target: lObj.target.id,
                left: lObj.left,
                right: lObj.right
            });
        }
        this.onSave.emit(newData);
    }

    /**
     * Clear Graph
     * */
    fnClear() {
        this.data = {nodes: [], links: []};
        this.fnUpdateChart();
        this.onClear.emit();
    }

    fnResize() {
        const element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

        this.svg.attr('width', element.offsetWidth).attr('height', element.offsetHeight);
        this.chart.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    }
}
