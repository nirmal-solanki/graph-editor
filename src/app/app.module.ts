import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {NodeGraphEditorComponent} from './node-graph-editor/node-graph-editor.component';

@NgModule({
    declarations: [
        AppComponent,
        NodeGraphEditorComponent
    ],
    entryComponents: [
        NodeGraphEditorComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
