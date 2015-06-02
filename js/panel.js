//DOM 
var panel = document.querySelector('#leftPanel');
document.querySelector('#leftPanel .container-fluid').addEventListener('click', function() {
    if (panel.classList.contains('close'))
        panel.classList.remove('close');
    else
        panel.classList.add('close');
});

document.querySelector('#language').addEventListener('change', function() {
    if (this.value !== 'css') {
        document.querySelector('#result').classList.remove('hidden');
    } else {
        document.querySelector('#result').classList.add('hidden');
    }
    var inserter = StyleInserter.get(document.querySelector('#editors').dataset.styleInserterID);

    inserter.type = this.value;
});

document.querySelector('#send').addEventListener('click', function() {
    var inserter = StyleInserter.get(document.querySelector('#editors').dataset.styleInserterID);

    inserter.compile(function(css) {
        if (inserter.type !== 'css') {
            inserter.copyCompiled()
            inserter.insertStyle(function() {}, false);
        }
    });
});



//Style Inserter
function StyleInserter(editor) {
    var that = this;
    that.id = StyleInserter._inserted.length + 1;
    that.type = 'css';
    that.preCompiled = '';
    that.css = ''
    that.editor = editor;
    that.autoInsert = true;
    editor.dataset.styleInserterID = that.id;
    this.showError = function(err) {

        return this;
    }
    this.clearError = function() {

        return this;
    }
    this.compile = function(cb) {
        var that = this;
        that.clearError();
        if (that.type === 'less') {
            less.Parser().parse(that.preCompiled, function(err, compiled) {
                if (err) {
                    that.showError(err);
                }
                if (compiled) {
                    that.css = compiled.toCSS();
                    cb(that.css);
                }
            }, {});
        } else {
            cb();
        }

        return that;
    }
    this.insertStyle = function(cb, compile) {
        var that = this;
        if (that.type === 'css' || !compile) {
            that.sendScript(that.getInsertScript(), cb);
        } else {
            that.compile(function() {
                that.sendScript(that.getInsertScript(), cb);
            })
        }
        return that;
    }

    this.getInsertScript = function() {
        var template = (function() {
            var styles = document.querySelectorAll('head style[data-lessinserter="true"][data-id="##ID##"]');
            for (var i = 0; i < styles.length; i++) {
                styles[i].remove();
            }
            var style = '##CSS##';
            var tag = document.createElement('style');
            tag.type = 'text/css';
            if (tag.styleSheet) {
                tag.styleSheet.cssText = style;
            } else {
                tag.appendChild(document.createTextNode(style));
            }
            tag.dataset.lessinserter = true;
            tag.dataset.id = '##ID##';
            document.querySelector('head').appendChild(tag)
        });
        template = template.toString().split('##ID##').join(this.id).split('##CSS##').join(this.css.replace(/\r?\n|\r/g, "").trim())
        return '(' + template + ')();';
    }

    this.sendScript = function(script, cb) {
        var that = this;
        that.clearError();
        if (chrome && chrome.devtools && chrome.devtools.inspectedWindow) {
            chrome.devtools.inspectedWindow.eval(script, function(err, b, c) {
                if (err) {
                    that.showError(err);
                }
                cb();
            });
        }
        return that;
    }

    this.copyCompiled = function(){
        this.editor.querySelector('.codeCompiled').editor.setValue(this.css);
    }

    function sanitizeString(str) {
        return str.replace(/\\'/g, '\'').replace(/'/g, '\\\'').trim()
    }

    //DOM Events
    that.editor.querySelector('.code').addEventListener('keyup', function(argument) {
        var style = sanitizeString(this.editor.getValue().replace(/\r?\n|\r/g, ""));;
        if (that.type !== 'css') {
            that.preCompiled = style;
        } else {
            that.css = style;
        }
        if (style === '') {
            that.editor.querySelector('.codeCompiled').editor.setValue('');
            return;
        }
        that.compile(function(css) {
            if (that.type !== 'css') {
                that.copyCompiled()
                if (that.autoInsert) {
                    that.insertStyle(function() {

                    }, false);
                }
            }
        });
    });
}
StyleInserter._inserted = [];
StyleInserter._inserted.push(new StyleInserter(document.querySelector('#editors')));
StyleInserter.get = function(id) {
    return this._inserted.filter(function(element) {
        return element.id === Number(id);
    })[0];
}
