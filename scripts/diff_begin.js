if (!domInspector || !domInspector.isDiff()) throw new Error('hmm');

function addStyleNode(id) {
  $(document.documentElement).append($('<style class="rb-style" id="' + id + '"/>'))
}
function addStyleLink(id) {
  $(document.documentElement).append($('<link class="rb-styleLink" type="text/css" rel="stylesheet" id="' + id + '"/>'));
}

addStyleLink('rb-syntaxTheme');

addStyleNode('codelineStyle');
addStyleNode('codelineColors');
addStyleNode('codelineAdjust');
addStyleNode('codelineFontSize');
addStyleNode('codelineSelectionFixer');
addStyleNode('lineNumberColor');

var changeStyleId = 0;
function changeStyle(id, style) {
  var node = $('#' + id);
  node.html(style);

  // If this diff is displayed inline in a containing patch set page, we need
  // the installed mutation observer to be triggered to possibly resize the
  // iframe. Changing a class on this node will trigger the observer.
  node.toggleClass('rb-trigger');
}

function createStyle(selector, attr, value) {
  if (typeof(selector) == 'string') selector = [selector];
  return $.map(selector, function(sel) {
    return sel + '{' + attr + ':' + value + ' !important' + '}\n';
  }).join('\n');
}

function updateCodelineFont() {
  chrome.storage.sync.get(['codeFontEnabled', 'codeFont'] , function(items) {
    var html = '';
    if (items['codeFontEnabled']) {
      html = createStyle(domInspector.codelineAll(), 'font-family', items['codeFont'] + ', monospace')
    }
    changeStyle('codelineStyle', html);
  });
}
updateCodelineFont();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineFont();
}, ['codeFontEnabled', 'codeFont']);

function updateCodelineFontSize() {
  chrome.storage.sync.get(['codeFontSizeEnabled', 'codeFontSize'] , function(items) {
    var html = '';
    if (items['codeFontSizeEnabled']) {
      html = createStyle(domInspector.codelineAll(), 'font-size', items['codeFontSize'])
    }
    changeStyle('codelineFontSize', html);
  });
}
updateCodelineFontSize();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineFontSize();
}, ['codeFontSizeEnabled', 'codeFontSize']);

function updateCodelineColors() {
  var itemsToGet = ['changeReplaceColor',
                    'colorBlindMode',
                    'improveDarkSyntaxDiffColors',
                    'turnLightsDown'];

  chrome.storage.sync.get(itemsToGet, function(items) {
    if (!items['changeReplaceColor'] && !items['colorBlindMode']) {
      changeStyle('codelineColors', '');
    }

    var html = createStyle(domInspector.codelineLight(), 'display', 'inline-block');

    var deleteColor = [255, 175, 175];
    var insertColor = [159, 255, 159];
    var replaceColor = [159, 175, 255];

    if (items['colorBlindMode']) {
      // From Cynthia Brewer's colorbrewer2.
      // deleteColor = 'rgb(217, 95, 2)';
      // insertColor = 'rgb(27, 158, 119)';
      // replaceColor = 'rgb(117, 112, 179)';
      // And lightened (in HSV-space and back) up a bit:
      // deleteColor = 'rgb(255, 112, 3)';
      // insertColor = 'rgb(43, 255, 192)';
      // replaceColor = 'rgb(167, 161, 255)';
      // And modified just slightly after playing with compiz filters:
      deleteColor = [255, 112, 3];
      insertColor = [43, 255, 162];
      replaceColor = [167, 112, 255];
    }

    // Default Rietveld Colors;
    var oldReplaceColor = deleteColor;
    var newReplaceColor = insertColor;

    if (items['changeReplaceColor']) {
      oldReplaceColor = newReplaceColor = replaceColor;
    }

    function toColor(col, al) {
      al = al || 1.0;

      let R = String(col[0]);
      let G = String(col[1]);
      let B = String(col[2]);
      let A = al;

      return 'rgba('+ R + ',' + G + "," + B + "," + A + ')';

      // return 'rgb(' + String(Math.floor(col[0]  + (255 - col[0]) * al))
      //     + ',' + String(Math.floor(col[1] + (255 - col[1]) * al)) + ','
      //     + String(Math.floor(col[2] + (255 - col[2]) * al)) + ')';
    }

    html += createStyle(domInspector.codelineOldDelete(), 'background-color', toColor(deleteColor));
    html += createStyle(domInspector.codelineNewInsert(), 'background-color', toColor(insertColor));


    if(items['turnLightsDown']){
      html += createStyle("body", 'background-color', toColor([30, 30, 30], 1.0));
      html += createStyle("body", 'color', toColor([200, 200, 200], 1.0));
      html += createStyle("a", 'color', toColor([81, 125, 193], 1.0));
    }

    if(items['improveDarkSyntaxDiffColors']){

        /**
         * Code diff color enhancements.
         */
        insertColor = [152, 209, 102];
        newReplaceColor = [152, 209, 102];

        html += createStyle(domInspector.codelineOldDelete(), 'background-color', toColor(deleteColor, 0.3));
        html += createStyle(domInspector.codelineNewInsert(), 'background-color', toColor(insertColor, 0.3));

        html += createStyle(domInspector.codelineOldReplaceDark(), 'background-color', toColor(oldReplaceColor, 0.3));
        html += createStyle(domInspector.codelineOldReplaceDark(), 'color', toColor([205 ,205 ,205 ], 1.0));

        html += createStyle(domInspector.codelineNewReplaceDark(), 'background-color', toColor(newReplaceColor, 0.3));
        html += createStyle(domInspector.codelineNewReplaceDark(), 'color', toColor([205 ,205 ,205 ], 1.0));

        html += createStyle(domInspector.codelineOldReplaceLight(), 'background-color', toColor(oldReplaceColor, 0.2));
        html += createStyle(domInspector.codelineNewReplaceLight(), 'background-color', toColor(newReplaceColor, 0.2));

        html += createStyle("div.code", 'background-color', toColor([50, 50, 50], 1.0));
        html += createStyle("div.code", 'border-color', toColor([100, 100, 100], 1.0));
        html += createStyle("div.codenav", 'background-color', toColor([50, 50, 50], 1.0));

        /**
         * Inline commenting color enhancements.
         */

        // Better comment text colors.
        let inlineCommentBg = [180, 180, 180];
        let inlineCommentText = [30, 30, 30];
        html += createStyle("tr.inline-comments > td", 'background-color', toColor(inlineCommentBg, 1.0));
        html += createStyle("div.inline-comment-title > span", 'color', toColor(inlineCommentText, 1.0));
        html += createStyle("div.comment-border", 'color', toColor(inlineCommentText, 1.0));
        html += createStyle("div.comment-border", 'border-color', toColor([200, 200, 200], 1.0));

        // Better link colors.
        html += createStyle("tr.inline-comments a", 'color', toColor([81, 125, 193], 1.0));

        // Better commenting input form background color.
        html += createStyle("tr.inline-comments textarea", 'background-color', toColor([222, 222, 222], 1.0));

    } else{
        html += createStyle(domInspector.codelineOldDelete(), 'background-color', toColor(deleteColor));
        html += createStyle(domInspector.codelineNewInsert(), 'background-color', toColor(insertColor));

        html += createStyle(domInspector.codelineOldReplaceDark(), 'background-color', toColor(oldReplaceColor));
        html += createStyle(domInspector.codelineNewReplaceDark(), 'background-color', toColor(newReplaceColor));
        html += createStyle(domInspector.codelineOldReplaceLight(), 'background-color', toColor(oldReplaceColor, 0.7));
        html += createStyle(domInspector.codelineNewReplaceLight(), 'background-color', toColor(newReplaceColor, 0.7));
    }

    changeStyle('codelineColors', html);
  });
}
updateCodelineColors();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineColors(true);
}, ['changeReplaceColor', 'colorBlindMode']);

function updateLineNumberColor() {
  chrome.storage.sync.get(['lineNumberColorEnabled'] , function(items) {
    var html = '';
    if (items['lineNumberColorEnabled']) {
      html = createStyle('.rb-lineNumber', 'color', 'rgb(128, 128, 128)')
    }
    changeStyle('lineNumberColor', html);
  });
}
updateLineNumberColor();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateLineNumberColor();
}, ['lineNumberColorEnabled']);


function fixDarkLines() {
  var html = createStyle(domInspector.codelineDark(), 'display', 'inline-block');
  changeStyle('codelineAdjust', html);
}
fixDarkLines();

// Display progress bar reflecting the percentage of reviewed files
// assuming that reviewer moves from the first file to last linearly.
(function() {
  var bar = null;

  function showBar() {
    if (bar !== null) {
      return;
    }

    // Find pane that floats on the left in the patch view.
    var pane = $("div > div > form[method='GET']").parent().parent();

    // Inject a div at the top and move to be at the very top of the pane
    // ignoring pane's padding.
    bar = $("<div/>").css("margin-top", "-5px")
                     .css("margin-left", "-5px")
                     .css("margin-bottom", "5px")
                     .css("margin-right", "-5px")
                     .prependTo(pane);

    // Find file select ("Jump to" one) on the same pane and use it
    // to calculate progress percentage.
    var select = pane.find("div > select").get(0);
    var pct = select.selectedIndex * 100 / select.length;

    // Create a percentage bar.
    $("<div/>").height(5)
               .width(pct * (pane.outerWidth() / 100))
               .css("background-color", "lightslategray")
               .prependTo(bar);
  }

  function hideBar() {
    if (bar !== null) {
      bar.remove();
      bar = null;
    }
  }

  function displayProgress() {
    chrome.storage.sync.get(['displayProgress'] , function(items) {
      if (items.displayProgress) {
        showBar();
      } else {
        hideBar();
      }
    });
  }

  chrome.storage.onChanged.addListener(displayProgress, ['displayProgress']);

  // When the DOM is ready.
  $(displayProgress);
})();