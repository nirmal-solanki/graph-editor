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
                d3.event.preventDefault();
                if (!self.mouseDownNode) {
                    return;
                }
                const mouse = d3.mouse(d3.select('.nodes').node());
                const r = self.mouseDownNode.r;
                self.dragLine.attr('d', 'M' + (self.mouseDownNode.x) + ',' + (self.mouseDownNode.y) +
                    'L' + (mouse[0]) + ',' + (mouse[1]));
            })
            .on('mouseup', () => {
                d3.event.preventDefault();
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

        this.svg.append('rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('height', this.height)
            .attr('width', this.width)
            .style('fill', 'transparent')
            .call(d3.zoom().scaleExtent([0.5, 2]).on('zoom', () => {
                self.chart.attr('transform', d3.event.transform);
            }));

        this.chart = this.svg.append('g')
            .attr('class', 'chart-area')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .append('g')
            .attr('class', 'zoom-area');

        this.dragLine = this.chart.append('svg:path')
            .attr('class', 'link drag-line')
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', 2)
            .attr('d', 'M0,0L0,0');

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
        const nodeGroupEnter = nodeGroup.enter().append('g').attr('class', 'node').call(this.drag);
        nodeGroupEnter.append('circle')
            .attr('class', 'parent')
            .attr('r', (d) => d.r)
            .style('cursor', 'crosshair')
            .style('fill', 'blue')
            .on('mousedown', function (d) {
                self.fnNodeMouseDown(self, d);
            })
            .on('mouseup', function (d) {
                self.fnNodeMouseUp(self, d);
            });

        nodeGroupEnter.append('circle')
            .attr('class', 'child')
            .attr('r', (d) => d.r - 5)
            .style('fill', 'skyblue');

        nodeGroupEnter.append('circle')
            .attr('class', 'delete')
            .attr('r', 8)
            .attr('cx', 15)
            .attr('cy', -15)
            .style('cursor', 'pointer')
            .style('fill', 'red')
            .on('click', function (d) {
                self.fnRemoveNode(self, d);
            });

        nodeGroupEnter.append('text')
            .attr('class', 'delete-text')
            .text('X')
            .attr('x', 15)
            .attr('y', -15)
            .style('fill', '#fff')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('font-family', 'verdana')
            .style('text-anchor', 'middle')
            .style('dominant-baseline', 'central')
            .on('click', function (d) {
                self.fnRemoveNode(self, d);
            });

        // update selection -- this will also contain the newly appended elements
        nodeGroup
            .select('circle.parent')
            .attr('r', (d) => d.r)
            .style('cursor', 'crosshair')
            .style('fill', 'blue')
            .on('mousedown', function (d) {
                self.fnNodeMouseDown(self, d);
            })
            .on('mouseup', function (d) {
                self.fnNodeMouseUp(self, d);
            });

        nodeGroup.select('circle.child')
            .attr('r', (d) => d.r - 5)
            .style('fill', 'skyblue');

        nodeGroup.select('circle.delete')
            .attr('r', 8)
            .attr('cx', 15)
            .attr('cy', -15)
            .style('cursor', 'pointer')
            .style('fill', 'red')
            .on('click', function (d) {
                self.fnRemoveNode(self, d);
            });

        nodeGroup.select('text.delete-text')
            .text('X')
            .attr('x', 15)
            .attr('y', -15)
            .style('fill', '#fff')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('font-family', 'verdana')
            .style('text-anchor', 'middle')
            .style('dominant-baseline', 'central')
            .on('click', function (d) {
                self.fnRemoveNode(self, d);
            });

        // exit selection
        nodeGroup.exit().remove();
        this.simulation.nodes(this.data.nodes).on('tick', () => {
            this.links.selectAll('.link').attr('d', self.fnDrawLine);

            this.nodes.selectAll('.node').attr('transform', (d) => `translate(${d.x}, ${d.y})`);
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
     * Mouse down event for select source node before connect to target node.
     * */
    fnNodeMouseDown(self, d) {
        d3.event.stopPropagation();
        if (d3.event.ctrlKey) {
            return;
        }

        self.mouseDownNode = d;
        // reposition drag line
        self.dragLine
            .style('marker-end', 'url(#end-arrow)')
            .attr('d', 'M' + (d.x) + ',' + (d.y) + 'L' +
                (d.x) + ',' + (d.y));
    }

    /**
     * Mouse up event for create new link and connect source and target node.
     * */
    fnNodeMouseUp(self, d) {
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
        const nodeName = prompt('Please enter node name', 'NODE:' + id);
        if (nodeName) {
            this.data.nodes.push({id: id, label: nodeName, r: 20});
        } else {
            this.data.nodes.push({id: id, label: 'NODE:' + id, r: 20});
        }
        this.fnUpdateChart();
    }

    /**
     * Remove node from graph.
     * */
    fnRemoveNode(self, d) {
        d3.event.stopPropagation();
        if (confirm('Are you sure you want to delete this node?')) {
            const sourceLinks = self.data.links.filter((slObj) => {
                return slObj.source.id === d.id;
            }).map((sl) => {
                return sl.index;
            });
            for (let i = sourceLinks.length - 1; i >= 0; i--) {
                self.data.links.splice(sourceLinks[i], 1);
            }
            const targetLinks = self.data.links.filter((tlObj) => {
                return tlObj.target.id === d.id;
            }).map((tl) => {
                return tl.index;
            });
            for (let j = targetLinks.length - 1; j >= 0; j--) {
                self.data.links.splice(targetLinks[j], 1);
            }
            self.data.nodes.splice(d.index, 1);
            self.fnUpdateChart();
        }
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
