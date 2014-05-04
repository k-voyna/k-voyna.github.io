/*jslint plusplus: true */
/*global $: true, jQuery: true */

// aux 
function isInt (n) {"use strict";
   return typeof n === 'number' && n % 1 === 0;
}

// public: ------------------------------------------------------
Calc = {};

// switches
Calc.updateSwitch = function () {"use strict";
    var classes, index, i, id;
    
    classes = $(this).parents ("tr").attr ('class').split(" ");
    
    for (i = 0; i < classes.length; ++i) {
        if (classes [i].indexOf('calc-row--') === 0) {
            id = classes [i].split ("--") [1];
        }
    }
          
    index = $(this).find ("option:selected").index ();
    
    $(".calc-case--" + id + "-" + (index + 1)).show ();
};

Calc.update = function (recalc) {"use strict";
    $("tr.calc-message").hide ();
    // FIXME: tr class
    // $("tr.optional").hide ();
    $(".calc .error").removeClass ("error");
    $(".calc .warning").removeClass ("warning");
    $(".calc tr[class*='calc-case']").hide ();
    $(".calc select").each (Calc.updateSwitch);
        
    recalc ();
};

Calc.init = function (recalc) {"use strict";  
    $("input.calc-set-switch").change (function () {
        var name, val;
        
        name = $(this).attr('name');
        val = $(this).val ();
                
        $("#calc-set--" + name + " div.calc-table").hide ();               
        $("#calc-table--" + val).show ();
    });
    
    $("input.calc-set-switch:checked").each (function () {
        $('input[name="' + $(this).attr ('name') + '"]:first').click ();
    });
       
    $(".calc-input-real input").change (function () {
        var val = $(this).val ();
        
        // TODO: add message
        
        if (isNaN (val)) {
            $(this).addClass ("error");
        } else {
            $(this).removeClass ("error");
        }
    });

    $(".calc-input-int input").change (function () {
        var val = parseFloat ($(this).val ());
        if (!isInt (val)) {
            $(this).addClass ("error");
        } else {
            $(this).removeClass ("error");
        }
    });
    
    $("table.calc-table input, table.calc-table select").change (function () {
        if (!$(this).hasClass ("error")) {
            Calc.update (recalc);
        }
    });

    $(".calc select").change (Calc.updateSwitch);
       
    $(".calc-tool input.calc-result-switch").change (function () {
        // FIXME tr class
        var row = $(this).parents ("div.calc-table").find ("table").find ("tr.optional");
        
        if ($(this).is (':checked')) {
            row.show ();
        } else {
            row.hide ();
        }
    });
    
    Calc.update (recalc);
};

Calc.calc = function (table, method) {"use strict";
    // declaration
    var prefix, key, format, value, valid, id, type, input, group, 
        data, errors, warnings;

    // functions
    function fnPlot (table, index) {
        if (index === undefined) {
            index = 0;
        }
        
        return $("#calc-plot--" + table + "-" + index);
    }
    
    function fnRow (table, row) {
        return $("#calc-row--" + table + "-" + row);
    }

    function fnMessage (table, msg) {
        return $("#calc-msg--" + table + "-" + msg);
    }

    function fnCell (table, row, selector) {
        return $("#calc-row--" + table + "-" + row + " " + selector);
    }

    function fnInputType (table, row) {
        var result, input;
    
        input = fnRow (table, row);

        if (input.hasClass ("calc-input-enum")) {
            result = "enum";
        } else if (input.hasClass ("calc-input-real")) {
            result = "real";
        } else if (input.hasClass ("calc-input-int")) {
            result = "int";
        }
    
        return result;
    }

    function fnInputReal (table, row, factor) {   
        return parseFloat (fnCell (table, row, "input").val ()) * factor;
    }

    function fnInputInt (table, row) {
        return parseInt (fnCell (table, row, "input").val (), 10);
    }

    function fnInputEnum (table, row, values) {
        var result, input;

        input = fnCell (table, row, "option:selected");

        if (values.length) {
            result = values [input.index ()];
        } else {
            result = input.val ();
        }
    
        return result;
    }
  
    function fnOutputString (table, row, value) {
        fnCell (table, row, ".calc-cell-value").text (value);
    }

    function fnOutputReal (table, row, value, factor, precision) {
        var num, exp, text;
        
        num = Number ((value / factor).toPrecision (precision));
        exp = Math.log (num) / Math.LN10;
           
        text = (num === 0) ? "0" : (exp < -3 ? "~0" : (exp > 4 ? "\u221E" : num));
           
        fnOutputString (table, row, text);
    }
    
   function fnOutputExp (table, row, value, factor, precision) {
        var num, exp, text;
        
        if (value === 0) {
            fnOutputString (table, row, 0);
        } else if (!isNaN (value)) {           
            exp = ((Math.log (Math.abs (value) / factor) / Math.LN10) - 0.5).toFixed (0);
            num = Number ((value / factor / Math.pow (10, exp)).toPrecision (precision));
               
            text = (num === 0) ? "0" : (exp == 0 ? num : num + '&sdot;10<sup>' + exp + '</sup>');
               
            fnCell (table, row, ".calc-cell-value").empty ().append (text);            
        } else {
            fnOutputString (table, row, NaN);
        }
    }    
    
    function fnOutputComplex (table, row, value, factor, precision) {
        var sign, numRe, expRe, numIm, expIm, text;
        
        numRe = Number ((value.x / factor).toPrecision (precision));
        expRe = Math.log (Math.abs (numRe)) / Math.LN10;
    
        numIm = Number ((value.y / factor).toPrecision (precision));
        expIm = Math.log (Math.abs (numIm)) / Math.LN10;
        
        if (expRe - expIm > 9) {
            numIm = 0;
        }

        if (expIm - expRe > 9) {
            numRe = 0;
        }
                      
        sign = value.y >= 0 ? "+" : "-";
           
        text = numRe + " " + sign + " j" + Math.abs (numIm); 
        
        fnOutputString (table, row, text);   
    }

    function fnOutputMessage (table, message, type) {
        var msg, classList;

        msg = fnMessage (table, message);

        classList = msg.attr ('class').split(/\s+/);
        $(classList).each (function (index) {
            var str = classList [index];
            if (str.indexOf ("calc-row--") === 0) {
                $ ("#" + str).addClass (type);
            }
        });

        msg.addClass (type).show ();
    }

    // variables
    data = {};
    errors = [];
    warnings = [];
    
    data.check = function (cond, id) {
        if (!cond) {
            errors.push (id);
        }
    };

    data.suggest = function (cond, id) {
        if (!cond) {
            warnings.push (id);
        }
    };
    
    data.plot = function (data, options, index) {
        $.plot (fnPlot (table.name, index), data, options);
    };
    
    valid = true;
    prefix = table.name;

    // input
    for (key in table.input) {
        if (table.input.hasOwnProperty (key)) {
            format = table.input [key];
            
            if (format instanceof Array) {
                type = fnInputType (prefix, key);
                
                if (type === "real") {
                    input = fnInputReal (prefix, key, format [0]);
                } else if (type === "int") {
                    input = fnInputInt (prefix, key);
                } else if (type === "enum") {
                    input = fnInputEnum (prefix, key, format);
                }
            } else {
                input = format;
            }

            data [key] = input;
        }
    }

    // calc
    method.call (data);

    // errors
    for (key in errors) {
        if (errors.hasOwnProperty (key)) {
            fnOutputMessage (prefix, errors [key], "error");
        }
    }

    // output
    for (key in table.output) {
        if (table.output.hasOwnProperty (key)) {
            format = table.output [key];
            
            // FIXME: check key duplicating
            
            if (format.length === 2) {
                fnOutputReal (prefix, key, data [key], format [0], format [1]);
            } else if (format.length === 3) {
                if (format [2] === 'complex') {
                    fnOutputComplex (prefix, key, data [key], format [0], format [1]);
                } else if (format [2] === 'exp') {
                    fnOutputExp (prefix, key, data [key], format [0], format [1]);
                }
            } else {
                fnOutputString (prefix, key, data [key]);
            }
        }
    }
       
    // warnings
    if (!errors.length) {
        for (key in warnings) {
            if (warnings.hasOwnProperty (key)) {
                fnOutputMessage (prefix, warnings [key], "warning");
            }
        }
    }

    return data;
    // return !errors.length ? data : {};
};
