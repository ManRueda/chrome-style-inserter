function getWindow(win, err) {
    if (err)
        alert(JSON.stringify(err));
}

function addLessSupport(cb){
    chrome.devtools.inspectedWindow.eval('less', function(less, err){
        if (!less && err){
            chrome.devtools.inspectedWindow.eval('$(document).find(\'head\').append(\'<script src="https://cdnjs.cloudflare.com/ajax/libs/less.js/1.6.3/less.min.js" type="text/javascript"></script>\')', cb);
        }else{
            cb();
        }

    });
}

function showError(err){
    $('#error').text(err);
}
function clearError(err){
    $('#error').text('');
}

function sanitizeString(str){
    return str.replace(/\\'/g, '\'').replace(/'/g, '\\\'')
}

function LESStoCSS (LESS, cb) {
    clearError();
    less.Parser().parse(LESS, function(a,b){
        if (a){
            showError(a.message);
        }
        if (b)
            cb(a, b.toCSS());
    }, {});
}

function generateInsertScript(css, cb){
    clearError();
    var style = [
        '<style type="text/css" data-lessinserter="true">',
        $.trim(css.replace(/\r?\n|\r/g, "")),
        '</style>',
    ].join('');
    var exec = [
        '$(document).find(\'head style[data-lessinserter]\').remove();',
        '$(document).find(\'head\').append(\'', style, '\');'
    ].join('');
    cb(exec);
}

function sendScript(script, cb){
    clearError();
    if (chrome && chrome.devtools && chrome.devtools.inspectedWindow){
        chrome.devtools.inspectedWindow.eval(script, function(a,b,c){
            getWindow(a,b,c);
            cb();
        });
    }
}

$(function(){
    $('#code').on('keydown', function(){
        $('#send').click();
    });
    $('#type').change(function(){
        $('#code').attr('mode', 'ace/mode/' + $('#type').val().toLocaleLowerCase());
        if ($('#type').val().toLocaleLowerCase() !== 'css'){
            $('#codeCompiled').parent().show();
        }else{
            $('#codeCompiled').parent().hide();
        }
    });
    $('#send').click(function(){
        clearError();
        var styleType = 'text/' + $('#type').val().toLocaleLowerCase();
        var style = $.trim(sanitizeString($('#code')[0].editor.getValue()).replace(/\r?\n|\r/g, ""));
        if ($.trim(style.replace(/\r?\n|\r/g, "")) === ''){
            $('#codeCompiled')[0].editor.setValue('');
            return;
        }

        if ($('#type').val().toLocaleLowerCase() === 'less'){
            LESStoCSS(style, function(err, css){
                $('#codeCompiled')[0].editor.setValue(css);
                generateInsertScript(css, function(exec){
                    sendScript(exec, function(){

                    });
                });
            });
        }else{
            generateInsertScript(style, function(exec){
                sendScript(exec, function(){

                });
            });
        }
        
    });


    $('#panel div.title').click(function(event){
        if ($(this).parents('.Container').hasClass('panelClose')){
            $(this).parents('.Container').removeClass('panelClose');
        }else{
            $(this).parents('.Container').addClass('panelClose');
        }
    });

});