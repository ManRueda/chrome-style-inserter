//DOM
$ = function(a){return document.querySelector(a);};

var panel = $('#leftPanel');
$('#leftPanel .container-fluid').addEventListener('click', function() {
    if (panel.classList.contains('close'))
        panel.classList.remove('close');
    else
        panel.classList.add('close');
});

$('#language').addEventListener('change', function() {
    if (this.value !== 'css') {
        $('#result').classList.remove('hidden');



        $('#downloadCode').classList.remove('hidden');
        $('#downloadCode').textContent = $('#downloadCode').dataset.template.replace('{0}', $('#language').selectedOptions[0].textContent);
        $('#downloadCode').download = 'style.' + $('#language').selectedOptions[0].textContent;

    } else {
        $('#result').classList.add('hidden');
        $('#downloadCode').classList.add('hidden');
    }
    var inserter = StyleInserter.get($('#editors').dataset.styleInserterID);

    inserter.editor.querySelector('.code').editor.session.setMode('ace/mode/' + this.value);
    inserter.type = this.value;
});

$('#send').addEventListener('click', function() {
    var inserter = StyleInserter.get($('#editors').dataset.styleInserterID);

    inserter.compile(function(css) {
        if (inserter.type !== 'css') {
            inserter.copyCompiled();
        }
        inserter.insertStyle(function() {}, false);
    });
});

$('#downloadCode').addEventListener('click', function(event){
    var inserter = StyleInserter.get($('#editors').dataset.styleInserterID);
    inserter.download(false);
});

$('#downloadCSS').addEventListener('click', function(event){
    var inserter = StyleInserter.get($('#editors').dataset.styleInserterID);
    inserter.download(true);
});

$('.error').addEventListener('click', function() {
    this.classList.add('hidden');
});



//Style Inserter
function StyleInserter(editor) {
    var that = this;
    that.id = StyleInserter._inserted.length + 1;
    that.type = 'css';
    that.preCompiled = '';
    that.css = '';
    that.editor = editor;
    that.autoInsert = true;
    editor.dataset.styleInserterID = that.id;
    this.showError = function(err) {
        this.editor.querySelector('.error').textContent = JSON.stringify(err);
        this.editor.querySelector('.error').classList.remove('hidden');
        return this;
    };
    this.clearError = function() {
        this.editor.querySelector('.error').classList.add('hidden');
        return this;
    };
    this.download = function(css){
        var link = document.createElement('a');
        if (css){
            link.download = 'style.css';
            link.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(this.css);
        }else{
            link.download = 'style.' + this.type.toLocaleLowerCase();
            link.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(this.preCompiled);
        }
        link.click();
    };
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
            cb(that.css);
        }

        return that;
    };
    this.insertStyle = function(cb, compile) {
        var that = this;
        if (that.type === 'css' || !compile) {
            that.sendScript(that.getInsertScript(), cb);
        } else {
            that.compile(function() {
                that.sendScript(that.getInsertScript(), cb);
            });
        }
        return that;
    };

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
            document.querySelector('head').appendChild(tag);
        });
        template = template.toString().split('##ID##').join(this.id).split('##CSS##').join(sanitizeString(this.css).replace(/\r?\n|\r/g, "").trim());
        return '(' + template + ')();';
    };

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
    };

    this.copyCompiled = function(){
        this.editor.querySelector('.codeCompiled').editor.setValue(this.css);
    };

    function sanitizeString(str) {
        return str.replace(/\\'/g, '\'').replace(/'/g, '\\\'').replace(/"/g, '\\"').trim();
    }

    //DOM Events
    that.editor.querySelector('.code').addEventListener('keyup', function(argument) {
        var style = this.editor.getValue().replace(/\r?\n|\r/g, "");
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
                that.copyCompiled();
            }
            if (that.autoInsert) {
                that.insertStyle(function() {
                }, false);
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
};
