import { GraphEditorPage } from './app.po';

describe('graph-editor App', () => {
  let page: GraphEditorPage;

  beforeEach(() => {
    page = new GraphEditorPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
