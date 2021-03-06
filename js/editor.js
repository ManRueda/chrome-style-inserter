(function(window, document, undefined) {
  // Refers to the "importer", which is index.html
  var thatDoc = document;

  // Refers to the "importee", which is src/juicy-ace-editor.html
  var thisDoc = document._currentScript.ownerDocument;

  // Gets content from <template>
  var template = thisDoc.querySelector('template').content;

  // Creates an object based in the HTML Element prototype
  var TomalecAceEditorPrototype = Object.create(HTMLElement.prototype);

  // Fires when an instance of the element is created
  TomalecAceEditorPrototype.createdCallback = function() {
    // Creates the shadow root
    var shadowRoot = this.createShadowRoot();

    // Shim CSS if needed
    // http://stackoverflow.com/questions/24497569/content-polyfill-for-vanillajs-templates-and-custom-elements
    if (Platform.ShadowCSS) {
      var style = template.querySelector('style');

      var cssText = Platform.ShadowCSS.shimCssText(
        style.textContent, 'juicy-ace-editor');
      Platform.ShadowCSS.addCssToDocument(cssText);
    }
    // Adds a template clone into shadow root
    var clone = thatDoc.importNode(template, true);
    shadowRoot.appendChild(clone);
  };

  // Fires when an instance was inserted into the document
  TomalecAceEditorPrototype.attachedCallback = function() {

    var text = this.childNodes[0];
    var container = document.createElement("div");
    container.id = "juicy-ace-editor-container";
    // shadowRoot.appendChild(container);
    // Workaround as CSS styles are added to main document, and does not cross Shadow DOM boundry
    // this.appendChild(container);
    this.insertBefore(container, this.firstChild);
    if (text)
      container.appendChild(text);


    var editor = this.editor || ace.edit(container);

    // inject base editor styles
    this.injectTheme('#ace_editor');

    // handle theme changes
    editor.renderer.addEventListener("themeLoaded", this.onThemeLoaded.bind(this));

    // initial attributes
    editor.setTheme(this.getAttribute("theme"));
    editor.setFontSize(this.getAttribute("fontsize"));
    editor.setReadOnly(this.getAttribute("readonly"));
    var session = editor.getSession();
    session.setMode(this.getAttribute("mode"));
    session.setUseSoftTabs(this.getAttribute("softtabs"));
    if (this.getAttribute("tabsize"))
      session.setTabSize(this.getAttribute("tabsize"));


    this.editor = editor;

    // Observe input textNode changes
    // Could be buggy as editor was also added to Light DOM;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        console.log("observation", mutation.type, arguments, mutations, editor, text);
        if (mutation.type == "characterData") {
          editor.setValue(text.data);
        }
      });
    });
    if (text){
      observer.observe(text, {
        characterData: true
      });
    }
    // container.appendChild(text);
    this._attached = true;
  };

  // Fires when an instance was removed from the document
  TomalecAceEditorPrototype.detachedCallback = function() {
    this._attached = false;
  };

  // Fires when an attribute was added, removed, or updated
  TomalecAceEditorPrototype.attributeChangedCallback = function(attr, oldVal, newVal) {
    if (!this._attached) {
      return false;
    }
    switch (attr) {
      case "theme":
        this.editor.setTheme(newVal);
        break;
      case "mode":
        this.editor.getSession().setMode(newVal);
        break;
      case "fontsize":
        this.editor.setFontSize(newVal);
        break;
      case "softtabs":
        this.editor.getSession().setUseSoftTabs(newVal);
        break;
      case "tabsize":
        this.editor.getSession().setTabSize(newVal);
        break;
      case "readonly":
        this.editor.setReadOnly(newVal);
        break;

    }
  };


  TomalecAceEditorPrototype.onThemeLoaded = function(e) {
    var themeId = "#" + e.theme.cssClass;
    this.injectTheme(themeId);
  };

  // inject the style tag of a theme to the element
  TomalecAceEditorPrototype.injectTheme = function(themeId) {
    var n = document.querySelector(themeId);
    this.appendChild(cloneStyle(n));
  };

  //helper function to clone a style
  function cloneStyle(style) {
    var s = document.createElement('style');
    s.id = style.id;
    s.textContent = style.textContent;
    return s;
  }

  document.registerElement('juicy-ace-editor', {
    prototype: TomalecAceEditorPrototype
  });
}(window, document));
