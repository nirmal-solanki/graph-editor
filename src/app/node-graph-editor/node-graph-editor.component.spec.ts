import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {NodeGraphEditorComponent} from './node-graph-editor.component';

describe('NodeGraphEditorComponent', () => {
    let component: NodeGraphEditorComponent;
    let fixture: ComponentFixture<NodeGraphEditorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NodeGraphEditorComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NodeGraphEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
